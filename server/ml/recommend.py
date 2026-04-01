import sqlite3
import pandas as pd
import sys
import json
import os
import numpy as np
from sklearn.neighbors import NearestNeighbors
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.preprocessing import MinMaxScaler

# Database path
DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), 'sqlite.db')

def get_db_connection():
    try:
        conn = sqlite3.connect(DB_PATH)
        return conn
    except Exception as e:
        return None

def clean_json_list(json_str):
    """Parses JSON list string or returns empty string"""
    try:
        if not json_str:
            return ""
        items = json.loads(json_str)
        if isinstance(items, list):
            return " ".join([str(i).lower().replace(" ", "") for i in items])
        return ""
    except:
        return ""

def hybrid_recommendation(target_user_id):
    conn = get_db_connection()
    if not conn:
        return []

    # ---------------------------------------------------------
    # 1. FETCH DATA
    # ---------------------------------------------------------
    
    # A. Target User (Pulling from both students and users to ensure we get data)
    query_target = f"""
        SELECT COALESCE(s.learning_style, u.learning_style) as learning_style, 
               COALESCE(s.interests, u.interests) as interests,
               COALESCE(s.preferred_budget, u.preferred_budget) as preferred_budget,
               COALESCE(s.preferred_mode, u.preferred_mode) as preferred_mode,
               s.city 
        FROM users u
        LEFT JOIN students s ON u.id = s.user_id
        WHERE u.id = {target_user_id}
    """
    df_user = pd.read_sql_query(query_target, conn)
    
    if df_user.empty:
        conn.close()
        return []

    user_row = df_user.iloc[0]
    user_budget = float(user_row['preferred_budget']) if pd.notna(user_row['preferred_budget']) else 2000.0
    user_mode = str(user_row['preferred_mode']).lower() if pd.notna(user_row['preferred_mode']) else ""
    user_city = str(user_row['city']).lower() if pd.notna(user_row['city']) else ""
    
    user_interests_str = clean_json_list(user_row['interests'])
    user_style_str = str(user_row['learning_style']).lower() if pd.notna(user_row['learning_style']) else ""
    
    user_features = user_interests_str + " " + user_style_str

    # B. Instructors
    query_instructors = """
        SELECT i.id, i.user_id, i.specialties, i.teaching_style, i.hourly_rate, 
               i.mode, i.location, i.languages, u.full_name 
        FROM instructors i
        JOIN users u ON i.user_id = u.id
    """
    df_instructors = pd.read_sql_query(query_instructors, conn)
    
    if df_instructors.empty:
        conn.close()
        return []

    # Build Instructor Features (Specialties + Style + Languages)
    df_instructors['features'] = (
        df_instructors['specialties'].apply(clean_json_list) + " " + 
        df_instructors['teaching_style'].fillna("").apply(lambda x: str(x).lower()) + " " +
        df_instructors['languages'].apply(clean_json_list)
    )

    # C. Interactions
    query_interactions = """
    SELECT user_id, instructor_id, 
           CASE 
             WHEN type = 'booking' THEN 5 
             WHEN type = 'review' THEN 4 
             WHEN type = 'view' THEN 1 
             ELSE 1 
           END as weight
    FROM interactions
    """
    df_interactions = pd.read_sql_query(query_interactions, conn)
    conn.close()

    # ---------------------------------------------------------
    # 2. CONTENT & HARD METRICS SCORING
    # ---------------------------------------------------------
    
    # A. Semantic Content Match (Cosine Similarity)
    corpus = [user_features] + df_instructors['features'].tolist()
    vectorizer = CountVectorizer()
    try:
        count_matrix = vectorizer.fit_transform(corpus)
        cosine_sim = cosine_similarity(count_matrix[0:1], count_matrix[1:])[0]
    except ValueError:
        cosine_sim = np.zeros(len(df_instructors))

    df_scores = df_instructors[['id', 'hourly_rate', 'mode', 'location']].copy()
    df_scores['cbf_score'] = cosine_sim
    
    # B. Budget Match
    def calculate_budget_score(row):
        try:
            rate = float(row['hourly_rate'])
            max_val = max(rate, user_budget)
            if max_val == 0: return 1.0
            return max(0, 1 - (abs(rate - user_budget) / max_val))
        except:
            return 0.5

    df_scores['budget_score'] = df_scores.apply(calculate_budget_score, axis=1)

    # C. Mode & Location Match
    def calculate_logistics_score(row):
        inst_mode = str(row['mode']).lower()
        inst_city = str(row['location']).lower()
        
        score = 0.5 # Base score
        
        # Mode matching
        if user_mode in inst_mode or inst_mode == 'both':
            score += 0.3
            
        # Location matching (only matters if they want offline/hybrid)
        if user_mode in ['offline', 'both'] and user_city and inst_city:
            if user_city in inst_city or inst_city in user_city:
                score += 0.2
                
        return min(1.0, score)

    df_scores['logistics_score'] = df_scores.apply(calculate_logistics_score, axis=1)

    # ---------------------------------------------------------
    # 3. COLLABORATIVE FILTERING
    # ---------------------------------------------------------
    
    df_scores['cf_score'] = 0.0
    
    if not df_interactions.empty:
        user_item_matrix = df_interactions.pivot_table(index='user_id', columns='instructor_id', values='weight', aggfunc='sum').fillna(0)
        
        if target_user_id in user_item_matrix.index:
            try:
                n_users = user_item_matrix.shape[0]
                n_neighbors = min(n_users - 1, 5)
                
                if n_neighbors > 0:
                    model_knn = NearestNeighbors(metric='cosine', algorithm='brute', n_neighbors=n_neighbors)
                    model_knn.fit(user_item_matrix)
                    
                    query_index = user_item_matrix.index.get_loc(target_user_id)
                    query_vector = user_item_matrix.iloc[query_index, :].values.reshape(1, -1)
                    
                    distances, indices = model_knn.kneighbors(query_vector, n_neighbors=n_neighbors + 1)
                    similar_users_indices = indices.flatten()[1:]
                    
                    rec_dict = {}
                    for i in similar_users_indices:
                        neighbor_user_id = user_item_matrix.index[i]
                        neighbor_interactions = user_item_matrix.loc[neighbor_user_id]
                        sim_weight = 1 - distances.flatten()[np.where(indices.flatten() == i)[0][0]]
                        
                        for inst_id, weight in neighbor_interactions.items():
                            if weight > 0:
                                rec_dict[inst_id] = rec_dict.get(inst_id, 0) + (weight * sim_weight)

                    for inst_id, score in rec_dict.items():
                        df_scores.loc[df_scores['id'] == inst_id, 'cf_score'] = score
                        
                    if df_scores['cf_score'].max() > 0:
                        scaler = MinMaxScaler()
                        df_scores['cf_score'] = scaler.fit_transform(df_scores[['cf_score']])
            except:
                pass 

    # ---------------------------------------------------------
    # 4. HYBRID MERGE & WEIGHTS
    # ---------------------------------------------------------
    
    w_cbf = 0.40      # Skills and interests
    w_budget = 0.25   # Affordability
    w_logistic = 0.20 # Online/Offline & City
    w_cf = 0.15       # Community behavior
    
    df_scores['final_score'] = (
        (df_scores['cbf_score'] * w_cbf) + 
        (df_scores['budget_score'] * w_budget) + 
        (df_scores['logistics_score'] * w_logistic) +
        (df_scores['cf_score'] * w_cf)
    )
    
    df_scores = df_scores.sort_values(by='final_score', ascending=False)
    
    return df_scores['id'].head(10).tolist()

if __name__ == "__main__":
    try:
        if len(sys.argv) < 2:
            print(json.dumps([]))
            sys.exit(0)
            
        target_user_id = int(sys.argv[1])
        recommendations = hybrid_recommendation(target_user_id)
        print(json.dumps(recommendations))
    except Exception as e:
        print(json.dumps([]))  
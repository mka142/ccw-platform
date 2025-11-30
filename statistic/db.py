import json
import os
from typing import List, Dict, Any, Optional
import pandas as pd

# Constants for database file paths
DB_CONCERTS = 'data/concerts.json'
DB_EXAMINATION_FORMS = 'data/examination_forms.json'
DB_FORMS = 'data/forms.json'
DB_USERS = 'data/users.json'


class Database:
    """Database handler for concert statistics"""
    
    def __init__(self, base_path: str = '.'):
        """
        Initialize database with path to data directory
        
        Args:
            base_path: Base path where data directory is located
        """
        self.base_path = base_path
        self._concerts = None
        self._forms = None
        self._users = None
        self._examination_forms = None
        
    def _load_json(self, filename: str) -> List[Dict[str, Any]]:
        """Load JSON file and return as list of dictionaries"""
        filepath = os.path.join(self.base_path, filename)
        with open(filepath, 'r', encoding='utf-8') as f:
            return json.load(f)
    
    @property
    def concerts(self) -> List[Dict[str, Any]]:
        """Lazy load concerts data"""
        if self._concerts is None:
            self._concerts = self._load_json(DB_CONCERTS)
        return self._concerts
    
    @property
    def forms(self) -> List[Dict[str, Any]]:
        """Lazy load forms data"""
        if self._forms is None:
            self._forms = self._load_json(DB_FORMS)
        return self._forms
    
    @property
    def users(self) -> List[Dict[str, Any]]:
        """Lazy load users data"""
        if self._users is None:
            self._users = self._load_json(DB_USERS)
        return self._users
    
    @property
    def examination_forms(self) -> List[Dict[str, Any]]:
        """Lazy load examination forms data"""
        if self._examination_forms is None:
            self._examination_forms = self._load_json(DB_EXAMINATION_FORMS)
        return self._examination_forms
    
    def list_concerts(self) -> List[Dict[str, Any]]:
        """
        List all available concerts
        
        Returns:
            List of concert dictionaries with _id, name, and metadata
        """
        return [
            {
                'id': concert['_id']['$oid'],
                'name': concert['name'],
                'metadata': concert.get('metadata', '{}'),
                'isActive': concert.get('isActive', False),
                'createdAt': concert.get('createdAt'),
                'updatedAt': concert.get('updatedAt')
            }
            for concert in self.concerts
        ]
    
    def list_concert_pieces(self, concert_id: str) -> List[str]:
        """
        List all unique pieces (pieceId) for a given concert
        
        Args:
            concert_id: Concert ObjectId as string
            
        Returns:
            List of unique piece IDs for the concert
        """
        # Get all users for this concert
        concert_user_ids = set()
        for user in self.users:
            if user['concertId']['$oid'] == concert_id:
                concert_user_ids.add(user['_id']['$oid'])
        
        # Get all unique pieces from forms for these users
        pieces = set()
        for form in self.forms:
            if form['clientId']['$oid'] in concert_user_ids:
                pieces.add(form['pieceId'])
        
        return sorted(list(pieces))
    
    def list_concert_piece_users(self, concert_id: str, piece_id: str) -> List[Dict[str, Any]]:
        """
        List all users who have forms for a specific concert and piece
        
        Args:
            concert_id: Concert ObjectId as string
            piece_id: Piece identifier string
            
        Returns:
            List of user dictionaries with user information
        """
        # Get all users for this concert
        concert_users = {}
        for user in self.users:
            if user['concertId']['$oid'] == concert_id:
                concert_users[user['_id']['$oid']] = user
        
        # Find users who have forms for this piece
        users_with_piece = set()
        for form in self.forms:
            if (form['clientId']['$oid'] in concert_users and 
                form['pieceId'] == piece_id):
                users_with_piece.add(form['clientId']['$oid'])
        
        # Return user information
        return [
            {
                'id': user_id,
                'deviceType': concert_users[user_id].get('deviceType'),
                'isActive': concert_users[user_id].get('isActive'),
                'createdAt': concert_users[user_id].get('createdAt'),
                'updatedAt': concert_users[user_id].get('updatedAt')
            }
            for user_id in sorted(users_with_piece)
        ]
    
    def get_forms_for_concert_piece_user(
        self, 
        concert_id: str, 
        piece_id: str, 
        user_id: str
    ) -> List[Dict[str, Any]]:
        """
        Get all forms for a specific concert, piece, and user
        
        Args:
            concert_id: Concert ObjectId as string
            piece_id: Piece identifier string
            user_id: User ObjectId as string
            
        Returns:
            List of form dictionaries
        """
        # Verify user belongs to this concert
        user_belongs_to_concert = False
        for user in self.users:
            if (user['_id']['$oid'] == user_id and 
                user['concertId']['$oid'] == concert_id):
                user_belongs_to_concert = True
                break
        
        if not user_belongs_to_concert:
            return []
        
        # Get all forms for this user and piece
        forms = []
        for form in self.forms:
            if (form['clientId']['$oid'] == user_id and 
                form['pieceId'] == piece_id):
                forms.append({
                    'id': form['_id']['$oid'],
                    'clientId': form['clientId']['$oid'],
                    'pieceId': form['pieceId'],
                    'timestamp': form['timestamp'],
                    'value': form['value'],
                    'createdAt': form.get('createdAt'),
                    'updatedAt': form.get('updatedAt')
                })
        
        # Sort by timestamp
        forms.sort(key=lambda x: x['timestamp'])
        return forms
    
    def get_forms_dataframe(
        self, 
        concert_id: Optional[str] = None, 
        piece_id: Optional[str] = None, 
        user_id: Optional[str] = None
    ) -> pd.DataFrame:
        """
        Get forms as pandas DataFrame with optional filtering
        
        Args:
            concert_id: Optional concert ObjectId to filter by
            piece_id: Optional piece identifier to filter by
            user_id: Optional user ObjectId to filter by
            
        Returns:
            pandas DataFrame with forms data
        """
        # Get user IDs that match the concert filter
        valid_user_ids = None
        if concert_id:
            valid_user_ids = set()
            for user in self.users:
                if user['concertId']['$oid'] == concert_id:
                    valid_user_ids.add(user['_id']['$oid'])
        
        # Filter forms
        filtered_forms = []
        for form in self.forms:
            client_id = form['clientId']['$oid']
            
            # Apply filters
            if valid_user_ids is not None and client_id not in valid_user_ids:
                continue
            if user_id and client_id != user_id:
                continue
            if piece_id and form['pieceId'] != piece_id:
                continue
            
            filtered_forms.append({
                'form_id': form['_id']['$oid'],
                'client_id': client_id,
                'piece_id': form['pieceId'],
                'timestamp': form['timestamp'],
                'value': form['value'],
                'created_at': form.get('createdAt'),
                'updated_at': form.get('updatedAt')
            })
        
        df = pd.DataFrame(filtered_forms)
        
        # Convert timestamp to datetime if dataframe is not empty
        if not df.empty:
            df['timestamp'] = pd.to_datetime(df['timestamp'], unit='ms')
            if 'created_at' in df.columns:
                df['created_at'] = pd.to_datetime(df['created_at'], unit='ms')
            if 'updated_at' in df.columns:
                df['updated_at'] = pd.to_datetime(df['updated_at'], unit='ms')
        
        return df
    
    def get_concert_statistics(self, concert_id: str) -> Dict[str, Any]:
        """
        Get aggregated statistics for a concert
        
        Args:
            concert_id: Concert ObjectId as string
            
        Returns:
            Dictionary with concert statistics
        """
        pieces = self.list_concert_pieces(concert_id)
        
        stats = {
            'concert_id': concert_id,
            'total_pieces': len(pieces),
            'pieces': {}
        }
        
        for piece_id in pieces:
            users = self.list_concert_piece_users(concert_id, piece_id)
            
            # Get all forms for this piece
            all_forms = []
            for user in users:
                user_forms = self.get_forms_for_concert_piece_user(
                    concert_id, piece_id, user['id']
                )
                all_forms.extend(user_forms)
            
            stats['pieces'][piece_id] = {
                'total_users': len(users),
                'total_forms': len(all_forms),
                'users': [u['id'] for u in users]
            }
        
        return stats

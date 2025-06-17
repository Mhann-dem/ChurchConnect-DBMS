# ================================================================

# File: backend/core/consumers.py
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model

User = get_user_model()

class NotificationConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for real-time notifications.
    """
    
    async def connect(self):
        self.user_id = self.scope['url_route']['kwargs']['user_id']
        self.room_group_name = f'notifications_{self.user_id}'
        
        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        
        await self.accept()
    
    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
    
    async def receive(self, text_data):
        """Receive message from WebSocket."""
        text_data_json = json.loads(text_data)
        message_type = text_data_json.get('type', 'message')
        message = text_data_json.get('message', '')
        
        # Send message to room group
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'send_notification',
                'message': message,
                'message_type': message_type
            }
        )
    
    async def send_notification(self, event):
        """Send notification to WebSocket."""
        message = event['message']
        message_type = event.get('message_type', 'info')
        
        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            'type': message_type,
            'message': message,
            'timestamp': str(timezone.now())
        }))

class DashboardConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for real-time dashboard updates.
    """
    
    async def connect(self):
        self.room_name = self.scope['url_route']['kwargs']['room_name']
        self.room_group_name = f'dashboard_{self.room_name}'
        
        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        
        await self.accept()
    
    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
    
    async def receive(self, text_data):
        """Receive message from WebSocket."""
        text_data_json = json.loads(text_data)
        update_type = text_data_json.get('type', 'update')
        data = text_data_json.get('data', {})
        
        # Broadcast update to room group
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'dashboard_update',
                'update_type': update_type,
                'data': data
            }
        )
    
    async def dashboard_update(self, event):
        """Send dashboard update to WebSocket."""
        update_type = event['update_type']
        data = event['data']
        
        # Send update to WebSocket
        await self.send(text_data=json.dumps({
            'type': update_type,
            'data': data,
            'timestamp': str(timezone.now())
        }))

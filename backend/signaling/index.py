import json
from typing import Dict, Any, List
import os

active_users: Dict[str, Dict[str, Any]] = {}
pending_calls: Dict[str, Dict[str, Any]] = {}

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    WebRTC сигнальный сервер для установки P2P голосовых звонков.
    Обрабатывает регистрацию пользователей, инициацию звонков, обмен SDP и ICE candidates.
    """
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    headers = event.get('headers', {})
    user_id = headers.get('x-user-id') or headers.get('X-User-Id')
    
    cors_headers = {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
    }
    
    if method == 'POST':
        body_data = json.loads(event.get('body', '{}'))
        action = body_data.get('action')
        
        if action == 'register':
            active_users[user_id] = {
                'userId': user_id,
                'username': body_data.get('username'),
                'online': True
            }
            
            return {
                'statusCode': 200,
                'headers': cors_headers,
                'body': json.dumps({
                    'success': True,
                    'message': 'User registered',
                    'userId': user_id
                }),
                'isBase64Encoded': False
            }
        
        elif action == 'call':
            target_user_id = body_data.get('targetUserId')
            offer = body_data.get('offer')
            
            call_id = f"{user_id}_{target_user_id}_{context.request_id[:8]}"
            pending_calls[call_id] = {
                'callId': call_id,
                'callerId': user_id,
                'targetId': target_user_id,
                'offer': offer,
                'status': 'ringing'
            }
            
            return {
                'statusCode': 200,
                'headers': cors_headers,
                'body': json.dumps({
                    'success': True,
                    'callId': call_id,
                    'message': 'Call initiated'
                }),
                'isBase64Encoded': False
            }
        
        elif action == 'answer':
            call_id = body_data.get('callId')
            answer = body_data.get('answer')
            
            if call_id in pending_calls:
                pending_calls[call_id]['answer'] = answer
                pending_calls[call_id]['status'] = 'active'
                
                return {
                    'statusCode': 200,
                    'headers': cors_headers,
                    'body': json.dumps({
                        'success': True,
                        'message': 'Answer sent',
                        'callId': call_id
                    }),
                    'isBase64Encoded': False
                }
            
            return {
                'statusCode': 404,
                'headers': cors_headers,
                'body': json.dumps({'error': 'Call not found'}),
                'isBase64Encoded': False
            }
        
        elif action == 'ice_candidate':
            call_id = body_data.get('callId')
            candidate = body_data.get('candidate')
            
            if call_id in pending_calls:
                if 'iceCandidates' not in pending_calls[call_id]:
                    pending_calls[call_id]['iceCandidates'] = []
                pending_calls[call_id]['iceCandidates'].append(candidate)
                
                return {
                    'statusCode': 200,
                    'headers': cors_headers,
                    'body': json.dumps({
                        'success': True,
                        'message': 'ICE candidate added'
                    }),
                    'isBase64Encoded': False
                }
            
            return {
                'statusCode': 404,
                'headers': cors_headers,
                'body': json.dumps({'error': 'Call not found'}),
                'isBase64Encoded': False
            }
        
        elif action == 'end':
            call_id = body_data.get('callId')
            
            if call_id in pending_calls:
                del pending_calls[call_id]
            
            return {
                'statusCode': 200,
                'headers': cors_headers,
                'body': json.dumps({
                    'success': True,
                    'message': 'Call ended'
                }),
                'isBase64Encoded': False
            }
    
    elif method == 'GET':
        query_params = event.get('queryStringParameters') or {}
        action = query_params.get('action')
        
        if action == 'poll':
            user_calls = [
                call for call in pending_calls.values()
                if call['targetId'] == user_id and call['status'] == 'ringing'
            ]
            
            return {
                'statusCode': 200,
                'headers': cors_headers,
                'body': json.dumps({
                    'calls': user_calls
                }),
                'isBase64Encoded': False
            }
        
        elif action == 'call_status':
            call_id = query_params.get('callId')
            
            if call_id in pending_calls:
                return {
                    'statusCode': 200,
                    'headers': cors_headers,
                    'body': json.dumps(pending_calls[call_id]),
                    'isBase64Encoded': False
                }
            
            return {
                'statusCode': 404,
                'headers': cors_headers,
                'body': json.dumps({'error': 'Call not found'}),
                'isBase64Encoded': False
            }
        
        elif action == 'online_users':
            return {
                'statusCode': 200,
                'headers': cors_headers,
                'body': json.dumps({
                    'users': list(active_users.values())
                }),
                'isBase64Encoded': False
            }
    
    return {
        'statusCode': 400,
        'headers': cors_headers,
        'body': json.dumps({'error': 'Invalid request'}),
        'isBase64Encoded': False
    }

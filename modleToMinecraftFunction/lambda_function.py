import json
import boto3
import requests
import jwt
import datetime
import uuid
import modelToStructure
awsRegion="us-east-2"
corsHeaders={'Access-Control-Allow-Headers': '*',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': '*'
                }
def lambda_handler(event,context):
    return errorResponse("not written")
def errorResponse(text,event):
    match text:
        case "invlaid headder":
            resp = {
                'statusCode': 200,
                'headers':corsHeaders,
                'body': json.dumps(event)}
        case _:
            resp = {
                'statusCode': 200,
                'headers':corsHeaders,
                'body': json.dumps(event)}
    return resp

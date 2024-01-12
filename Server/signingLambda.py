import json
import requests
import jwt
corsHeaders={'Access-Control-Allow-Headers': '*',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': '*'
                }

def lambda_handler(event, context):
    decoded={"json":{},"auth":False}
    if "header" in event.keys():
        if "Authorization" in event["header"].keys():
            decoded=verifyToken(event["header"]["Authorization"])
    if decoded["auth"]:
        retval={
            'statusCode': 200,
            'headers':corsHeaders,
            'body': json.dumps('Hello from Lambda!')
        }
    else:
        retval={
            'statusCode': 401,
            'headers':corsHeaders,
            'body': json.dumps('Authentication Failed')
        }
    return retval
def verifyToken(token):
    kidUrl="https://cognito-idp.us-east-2.amazonaws.com/us-east-2_F8JCwtZAa/.well-known/jwks.json" 
    response = requests.get(kidUrl)
    
    keys = json.loads(response.content)["keys"]
    
    jwtheaders=jwt.get_unverified_header(token)
    alg=jwtheaders["alg"]
    unverified=jwt.decode(token,options={"verify_signature":False})
    for key in keys:
        if key['kid'] == jwtheaders["kid"]:
            jwkValue=key
    print(json.dumps(jwkValue))
    publicKey = jwt.algorithms.RSAAlgorithm.from_jwk(json.dumps(jwkValue))
    try:
        decoded=jwt.decode(token,publicKey,algorithms=[alg])
        retVal={"json":decoded,"auth":True}
    except:
        retVal={"json":{},"auth":False}
    return retVal
token="eyJraWQiOiJiYmRhc2VNMFwvUlE5bmtVN2JjdktnbWhReU5BWlBMazZ0MUxHand0cHhMYz0iLCJhbGciOiJSUzI1NiJ9.eyJzdWIiOiIxNjg5NWFjYi02MmI0LTRiZTQtOWQwZS0zNjhmYzEzNDBlNjYiLCJpc3MiOiJodHRwczpcL1wvY29nbml0by1pZHAudXMtZWFzdC0yLmFtYXpvbmF3cy5jb21cL3VzLWVhc3QtMl9GOEpDd3RaQWEiLCJjbGllbnRfaWQiOiJ0ZXNlNWpvbWdmMjI1bHJ2ZXNjZzVvOTZsIiwib3JpZ2luX2p0aSI6ImQ0YmRiYzViLWVjOTgtNDFjOC05YmFhLWFiNmExZjZmMTg1NCIsImV2ZW50X2lkIjoiNjQ3NGRjODMtODE2Ny00YWJhLWI3ZDQtMWQ4NzRkYWIzN2EwIiwidG9rZW5fdXNlIjoiYWNjZXNzIiwic2NvcGUiOiJhd3MuY29nbml0by5zaWduaW4udXNlci5hZG1pbiIsImF1dGhfdGltZSI6MTcwNDgxMjMzOSwiZXhwIjoxNzA0OTg3MzA5LCJpYXQiOjE3MDQ5ODM3MDksImp0aSI6IjQ1ZjdmMTY3LWI1M2YtNDBiZS1hMGMzLWY3MzhkMmM3NWI5MSIsInVzZXJuYW1lIjoibWFkZGhhdHRlciJ9.KTwvYspziXEIlGCarpL_4LsUD2xYrQOuwk9Yew91uMLNM3YK2fNs9mTfw1slrBttf7_9kI9rJbfAwd5MQSsjkbcQsf2zMceXEbjsYN6BpD5g-3sCQ14PkVth_0jq8Jr_17x5drrXupQ9Vq5YXy2Tont6XnPvewtjp3t2-B8YzgLWU6E4aux63_Bx1qRPcDxRef5Zu1F4-_UiiBm_ggQHHWEotCL84Qf2BGALoyuUuarcotdJ2pM8qZNfUMCoJSd0qlqEIkngl9grtYt8V9tg94wlnvy_iKPoJQry8Z_OOXr2V3K-ljUxiNHV7m7hLM1CdyqKe7QfHJIojjkh9BVA9w"
lambda_handler({"header":{"Authorization":token}},{})

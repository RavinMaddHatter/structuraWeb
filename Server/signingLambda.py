import json
import boto3
import requests
import jwt
import uuid
s3BucketName="structuralab.com"
corsHeaders={'Access-Control-Allow-Headers': '*',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': '*'
                }
 
def lambda_handler(event, context):
    if not("page" in event["headers"]):
        return errorResponse("invlaid header",event)
    page=event["headers"]["page"]
    
    match page:
        case "item":
            return getItem(event["headers"]["filter"])
        case "upload1":
            return getS3Sig(event["headers"]["filter"],event["headers"]["token"],event["headers"]["files"])
        case "profileupdate":
            return updateProfile(event["headers"])
        case "profile":
            try:
                return getProfile(event["headers"]["filter"])
            except:
                return errorResponse("","No Profile Found")
        case "default":
            return getResults("")
        case _:
            return getResults("")
        
    
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
    
    
def getResults(start):
    dynamodb = boto3.resource('dynamodb', region_name="us-east-2")
    table = dynamodb.Table("StructuraWebsite")
    response = table.scan(
        FilterExpression= 'GUID > :start',
        ExpressionAttributeValues= {':start': start}
    )
    
    data = response['Items']*2
    return  {
        'statusCode': 200,
        'headers':{'Access-Control-Allow-Headers': '*',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': '*'
                },
        'body': json.dumps({"items":data}, default=int)
    }
    
def getItem(guid):
    dynamodb = boto3.resource('dynamodb', region_name="us-east-2")
    table = dynamodb.Table("StructuraWebsite")
    response = table.get_item(Key={"GUID":guid})
    return  {
        'statusCode': 200,
        'headers':{'Access-Control-Allow-Headers': '*',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': '*'
                },
        'body': json.dumps({"item":response['Item']}, default=int)
    }
def getS3Sig(filter, token, files):
    decoded=verifyToken(token)
    if decoded["auth"]:
        s3Client = boto3.client('s3')
        folder=uuid.uuid4()
        urls={}
        if type(files) is str:
            files=files.split(",")
        for file in files:
            urls[file] = s3Client.generate_presigned_url('get_object', Params = {'Bucket': s3BucketName, 'Key': f"{folder}/{file}"}, ExpiresIn = 3600)

        
        retval={
            'statusCode': 200,
            'headers':corsHeaders,
            'body': json.dumps(urls)
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
    
def updateProfile(headders):
    decoded=verifyToken(headders["token"])
    if decoded["auth"]:
        dynamodb = boto3.resource('dynamodb')
        table = dynamodb.Table('webProfiles')
        table.put_item(
            Item={
                'name': decoded["json"]["username"],
                'Discord': headders["discord"],
                'Ko-Fi': headders["kofi"],
                'Paetron': headders["patreon"],
                'Twitch': headders["twitch"],
                "Youtube":headders["youtube"]
            })
        retval={
            'statusCode': 200,
            'headers':corsHeaders,
            'body': json.dumps("Update Sucessfull!")
            }
    else:
        retval={
            'statusCode': 401,
            'headers':corsHeaders,
            'body': json.dumps('Authentication Failed')
        }
    return retval
def getProfile(userName):
    dynamodb = boto3.resource('dynamodb')
    table = dynamodb.Table('webProfiles')
    response = table.get_item(
        Key={
            'name': userName
        })
    retval={
            'statusCode': 200,
            'headers':corsHeaders,
            'body': json.dumps(response['Item'], default=int)
        }
    return retval

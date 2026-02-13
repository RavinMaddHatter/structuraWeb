import json
import sys
import boto3
import requests
import jwt
import datetime
import uuid
import os
import modelToStructure
import converter
import image_maker
awsRegion="us-east-2"
s3Bucket = "structuralab.com"
corsHeaders={'Access-Control-Allow-Headers': '*',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': '*'
                }
def lambda_handler(event,context):
    try:
        page=event["headers"]["page"]
        match page:
            case "makeMapArt":
                token = event["headers"]["token"]
                location = event["headers"]["loc"]
                guid = event["headers"]["guid"]
                palette = event["headers"]["palette"]
                name = event["headers"]["name"]
                return makeMapArt(location,palette,name,guid)
            case "upload":
                return getS3Sig(event["headers"]["token"],event["headers"]["file"])
            case "convertFile":
                #(token, path, scale, rotation, guid)
                rotx=int(event["headers"]["rotx"])
                roty=int(event["headers"]["roty"])
                rotz=int(event["headers"]["rotz"])
                scale=int(event["headers"]["scale"])
                return convertFile(event["headers"]["token"],event["headers"]["loc"],scale,[rotx,roty,rotz],event["headers"]["guid"])
            case "extractStructures":
                return extract_files(event["headers"]["token"],event["headers"]["loc"],event["headers"]["guid"])
        return errorResponse("not written",event)
    except Exception as e:
        exc_type, exc_obj, exc_tb = sys.exc_info()
        fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]
                    
        print(exc_type, fname, exc_tb.tb_lineno)
        data={'content': "failed due to error processing file. Error {}, in file {}, line number {}".format(str(e), fname, exc_tb.tb_lineno)}
        data["headders"]=event
        return errorResponse("error", data)
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

def is_image_extension(filename):
    """
    Checks if the file extension is a common image format.
    """
    image_extensions = {".jpg", ".jpeg", ".png", ".gif", ".bmp", ".tiff", ".webp", ".ico"}
    # Use os.path.splitext to separate name and extension
    _, file_extension = os.path.splitext(filename)
    return file_extension.lower() in image_extensions
def getS3Sig(token, file):
    decoded=verifyToken(token)
    if decoded["auth"]:
        s3Client = boto3.client('s3')
        folder="temp/"+str(uuid.uuid4())
        if file.endswith(".stl") or file.endswith(".STL") or file.endswith(".ZIP") or file.endswith(".zip")or file.endswith(".MCWORLD") or file.endswith(".mcworld") or is_image_extension(file):
            data={}
            serverFileName=file
            url = s3Client.generate_presigned_url('put_object', Params = {'Bucket': s3Bucket, 'Key': f"{folder}/{serverFileName}"}, ExpiresIn = 3600)
            data["url"]=url
            data["path"]=f"{folder}/{serverFileName}"
            data["guid"]=folder
            retval={
                'statusCode': 200,
                'headers':corsHeaders,
                'body': json.dumps(data)
            }
        else:
            retval={
                'statusCode': 401,
                'headers':corsHeaders,
                'body': json.dumps('Only STL files are allowed')
            }
    else:
        retval={
            'statusCode': 401,
            'headers':corsHeaders,
            'body': json.dumps('Authentication Failed')
        }
    return retval
def extract_files(token, path, guid):
    try:
        folder=f"/tmp/{guid}"
        os.makedirs(folder, exist_ok=True)
        s3_client = boto3.client('s3')
        os.makedirs(os.path.join("/tmp", guid), exist_ok=True)
        s3_client.download_file(s3Bucket, path, f"/tmp/{guid}/test.mcworld")
        folder=f"/tmp/{guid}/test.mcworld"
        exported_file = converter.dump_strucures(f"/tmp/{guid}/test.mcworld")
        s3_client.upload_file(exported_file, s3Bucket, f"{guid}/exported_structures.zip")
        retval={
                    'statusCode': 401,
                    'headers':corsHeaders,
                    'body': json.dumps({"downloadLoc":f"https://s3.us-east-2.amazonaws.com/structuralab.com/{guid}/exported_structures.zip"})
                }
        return  retval
    except Exception as e:
        exc_type, exc_obj, exc_tb = sys.exc_info()
        fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]
                    
        print(exc_type, fname, exc_tb.tb_lineno)
        data={'content': "failed due to error convert file. Error {}, in file {}, line number {}".format(str(e), fname, exc_tb.tb_lineno)}
        return errorResponse("error", data)
def convertFile(token, path, scale, rotation, guid):
    folder=f"/tmp/{guid}"
    os.makedirs(folder, exist_ok=True)
    
    if path.endswith(".stl") or path.endswith(".STL"):
        s3_client = boto3.client('s3')
        s3_client.download_file(s3Bucket, path, f"/tmp/{path}")
    converter = modelToStructure.modelConverter(f"/tmp/{path}")
    converter.rotate(rotation[0],rotation[1],rotation[2])
    converter.scaleMesh(scale)
    name = converter.makeModel(folder)
    s3_client.upload_file(f"/tmp/{guid}/{name}", s3Bucket, f"{guid}/{name}")
    retval={
                'statusCode': 200,
                'headers':corsHeaders,
                'body': json.dumps({"downloadLoc":f"https://s3.us-east-2.amazonaws.com/structuralab.com/{guid}/{name}"})
            }
    return  retval
        
def verifyToken(token):
    return {"json":"decoded","auth":True}
    kidUrl="https://cognito-idp.us-east-2.amazonaws.com/us-east-2_F8JCwtZAa/.well-known/jwks.json" 
    response = requests.get(kidUrl)
    
    keys = json.loads(response.content)["keys"]
    
    jwtheaders=jwt.get_unverified_header(token)
    alg=jwtheaders["alg"]
    unverified=jwt.decode(token,options={"verify_signature":False})
    for key in keys:
        if key['kid'] == jwtheaders["kid"]:
            jwkValue=key
    publicKey = jwt.algorithms.RSAAlgorithm.from_jwk(json.dumps(jwkValue))
    try:
        decoded=jwt.decode(token,publicKey,algorithms=[alg])
        retVal={"json":decoded,"auth":True}
    except:
        retVal={"json":{},"auth":False}
    return retVal
def makeMapArt(image_path,pallete,export_name,guid):
    export_name=export_name.replace(" ","_")
    os.makedirs(f"/tmp/{guid}/", exist_ok=True)
    export_file_name = f"/tmp/{guid}/{export_name}"
    print("export file name")
    print(export_file_name)
    image_file_name = f"/tmp/{image_path}"
    if is_image_extension(image_path):
        s3_client = boto3.client('s3')
        s3_client.download_file(s3Bucket, image_path, image_file_name)
    pallete=json.loads(pallete)
    image_maker.make_image(image_file_name,pallete,export_file_name)
    s3_client.upload_file(f"{export_file_name}.mcstructure", s3Bucket, f"{guid}/{export_name}.mcstructure")
    retval={
                'statusCode': 200,
                'headers':corsHeaders,
                'body': json.dumps({"downloadLoc":f"https://s3.us-east-2.amazonaws.com/structuralab.com/{guid}/{export_name}.mcstructure"})
            }
    return retval

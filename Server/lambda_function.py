import json
import boto3
import requests
import jwt
import datetime
import uuid
from PIL import Image
import io
import html
from botocore.exceptions import ClientError
from boto3.dynamodb.conditions import Key, Attr
import datetime
import os
from math import ceil
from decimal import Decimal, Context
ctx = Context(prec=38)

structuraGeneralSiteTable="StructuraWebsite"
awsRegion="us-east-2"
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
        case "usrprofile":
            return signedProfile(event["headers"])
        case "updateItem":
            return updateItem(event["headers"])
        case "deleteitem":
            return deleteItem(event["headers"])
        case "likePost":
            return likePost(event["headers"])
        case "resizeimages":
            return fixImageSizes(event["headers"])
        case "default":
            return getResults(page,event["headers"]["filter"])
        case "createSiteMap":
            return createSiteMap()
        case _:
            return getResults(page,event["headers"]["filter"])
        
    
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
    
def likePost(headders):
    decoded=verifyToken(headders["token"])
    if decoded["auth"]:
        guid = headders["filter"]
        dynamodb = boto3.resource('dynamodb', region_name="us-east-2")
        table = dynamodb.Table(structuraGeneralSiteTable)
        response = table.get_item(Key={'GUID': guid})
        
        itemData = response["Item"]
        username=decoded["json"]["username"]
        dynamodb = boto3.resource('dynamodb')
        profTab = dynamodb.Table('webProfiles')
        response = profTab.get_item(Key={'name': username})
        profData= response["Item"]
        if not("likes" in profData.keys()):
            profData["likes"]=[]
        if not("likes" in itemData.keys()):
            itemData["likes"]=[]
        if decoded["json"]["username"] in itemData["likes"]:
            itemData["likes"].remove(decoded["json"]["username"])
            profData["likes"].remove(itemData["GUID"])
        else:
            itemData["likes"].append(decoded["json"]["username"])
            profData["likes"].append(itemData["GUID"])
        
        profTab.put_item(
                    Item=profData)
        itemData["favorites"]=len(itemData["likes"])+1
        score = calculateRank(itemData)
        itemData["rank"]=score
        table.put_item(Item=itemData)
        retval={
                'statusCode': 200,
                'headers':corsHeaders,
                'body': json.dumps({"message":"Update Sucessfull!","item":itemData},default=float)
                }
        return retval
        
    return {
        'statusCode': 200,
        'headers':{'Access-Control-Allow-Headers': '*',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': '*'
                },
        'body': json.dumps()
        
    }
def getResults(page, pageNumber):
    dynamodb = boto3.resource('dynamodb', region_name="us-east-2")
    table = dynamodb.Table(structuraGeneralSiteTable)
    response={}
    categories=["Farms","Buildings","Terrain","Villager","Storage","Flying",
            "Furnaces","Redstone","Statues","Misc"]
    page=page.replace("#","")
    if page in categories:
        response = table.query(
                IndexName='Category-index',
                KeyConditionExpression=Key('Category').eq(page),
                FilterExpression= 'Visible = :vis',
                ExpressionAttributeValues= {':vis': True })
    else:
        keyFilter=Key("Visible").eq(True) & Attr("Description").ne("none") & Attr("hatterPenelty").not_exists() & Attr("Name").ne("Name Not Set") 
        response = table.query(
                IndexName='env-index',
                KeyConditionExpression=Key('env').eq("prod"),
                FilterExpression= keyFilter) 
    for item in response['Items']:
        item["rank"]=calculateRank(item)
    data = response['Items'] 

    
    return  {
        'statusCode': 200,
        'headers':{'Access-Control-Allow-Headers': '*',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': '*'
                },
        'body': json.dumps({"items":data}, default=float)
    }
    
def getItem(guid):
    dynamodb = boto3.resource('dynamodb', region_name="us-east-2")
    table = dynamodb.Table(structuraGeneralSiteTable)
    response = table.get_item(Key={"GUID":guid})
    
    if not("likes" in response['Item'].keys()):
        response['Item']["likes"]=[]
    return  {
        'statusCode': 200,
        'headers':{'Access-Control-Allow-Headers': '*',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': '*'
                },
        'body': json.dumps({"item":response['Item']}, default=float)
    }
def getS3Sig(filter, token, files):
    decoded=verifyToken(token)
    if decoded["auth"]:
        s3Client = boto3.client('s3')
        folder=str(uuid.uuid4())
        data={}
        data["guid"]=folder
        urls={}
        userName=decoded["json"]["username"]
        
        dynamoDBentry={}
        dynamoDBentry["GUID"]=folder
        dynamoDBentry["Category"] = "Misc"
        dynamoDBentry["Creator"] = decoded["json"]["username"]
        dynamoDBentry["date"] = int(datetime.datetime.utcnow().timestamp())
        dynamoDBentry["Description"] = "none"
        dynamoDBentry["Name"] = "Name Not Set"
        dynamoDBentry["Visible"] = False
        dynamoDBentry["edits"] = 0
        dynamoDBentry["env"] = "prod"
        dynamoDBentry["pickUploaded"] = False
        dynamoDBentry["rank"] = ctx.create_decimal_from_float(0.0002)
        dynamoDBentry["downloads"] = 1
        dynamoDBentry["favorites"] = 1
        dynamoDBentry["structureFiles"] = {}
        dynamoDBentry["MaterialsList"] = {}
        if type(files) is str:
            files=files.split(",")
        for file in files:
            if file.endswith(".mcstructure"):
                serverFileName=file
                dynamoDBentry["structureFiles"][file] = f"https://s3.us-east-2.amazonaws.com/structuralab.com/{folder}/{serverFileName}"
                urls[file] = s3Client.generate_presigned_url('put_object', Params = {'Bucket': "structuralab.com", 'Key': f"{folder}/{serverFileName}"}, ExpiresIn = 3600)
        data["urls"]=urls
        dynamodb = boto3.resource('dynamodb')
        table = dynamodb.Table(structuraGeneralSiteTable)
        table.put_item(Item = dynamoDBentry)
        retval={
            'statusCode': 200,
            'headers':corsHeaders,
            'body': json.dumps(data)
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
def calculateRank(data):
    score=float(data["downloads"])+float(data["favorites"])*50
    if "hatterPenelty" in data.keys():
        score*=0.00000000000000001
    if data["Name"]=="Name Not Set":
        score*=0.001
    if data["Description"]=="none":
        score*=0.001
    NoPic=not(data["pickUploaded"])
    yt=False
    if "youtube" in data.keys():
        yt = not(len(data["youtube"])>5)
    if yt and NoPic:
        score*=0.001
    curDate = int(datetime.datetime.utcnow().timestamp())
    score=score/(1+(curDate-float(data["date"]))/86400)
    return ctx.create_decimal_from_float(score)

def updateItem(headders):
    decoded=verifyToken(headders["token"])
    if decoded["auth"]:
        headders["data"]=json.loads(headders["data"])
        dynamodb = boto3.resource('dynamodb')
        table = dynamodb.Table(structuraGeneralSiteTable)
        guid = headders["filter"]
        response = table.get_item(Key={'GUID': guid})
        itemData = response["Item"]
        if decoded["json"]["username"] == itemData["Creator"]:
            for key in itemData.keys():
                if type(itemData[key]) is str:
                    itemData[key]=html.escape(itemData[key])
            itemData["Name"] = headders["data"]["name"]
            itemData["Description"] = headders["data"]["description"]
            itemData["Visible"] = headders["data"]["visibility"]
            itemData["env"] = "DEV"
            if itemData["Visible"]:
                itemData["env"] = "prod"
            itemData["Category"] = headders["data"]["category"]
            
            if("youtubelink" in headders["data"].keys()):
                itemData["youtube"] = headders["data"]["youtubelink"]
                headders["data"]="saw youtube"
            score = calculateRank(itemData)
            itemData["rank"]=score
            checkPicture(itemData) ## includes put to table
            s3Client = boto3.client('s3')
            s3 = boto3.resource('s3')
            bucket=s3.Bucket('structuralab.com')
            [pagePath,visibility] = generateItemHTML(itemData,bucket)
            
            url = s3Client.generate_presigned_url('put_object', Params = {'Bucket': "structuralab.com", 'Key': f"{guid}/fullSizedPicture.png"}, ExpiresIn = 300)
            retval={
                'statusCode': 200,
                'headers':corsHeaders,
                'body': json.dumps({"message":"Update Sucessfull!","thumbnailURL":url,"data":itemData,"url":pagePath},default=float)
                }
        else:
            retval={
                'statusCode': 401,
                'headers':corsHeaders,
                'body': json.dumps('Authentication Failed')
            }
    else:
        retval={
            'statusCode': 401,
            'headers':corsHeaders,
            'body': json.dumps('Authentication Failed')
        }
    return retval
    

def updateProfile(headders):
    decoded=verifyToken(headders["token"])
    if decoded["auth"]:
        username=decoded["json"]["username"]
        dynamodb = boto3.resource('dynamodb')
        table = dynamodb.Table('webProfiles')
        for key in headders.keys():
            if type(headders[key]) is str:
                headders[key]=html.escape(headders[key])
        table.put_item(
            Item={
                'name': username,
                'Discord': headders["discord"],
                'Ko-Fi': headders["kofi"],
                'Paetron': headders["patreon"],
                'Twitch': headders["twitch"],
                "Youtube":headders["youtube"]
            })
        s3Client = boto3.client('s3')
        url = s3Client.generate_presigned_url('put_object', Params = {'Bucket': "structuralab.com", 'Key': f"Profiles/{username}/profilePic.png"}, ExpiresIn = 300)
        
        retval={
            'statusCode': 200,
            'headers':corsHeaders,
            'body': json.dumps({"message":"Update Sucessfull","iconURL":url})
            }
    else:
        retval=errorResponse("","Failed Authentication")
    return retval
def checkPicture(item):
    guid=item["GUID"]
    s3 = boto3.resource('s3')
    item["pickUploaded"]=exists(f"http://structuralab.com/{guid}/fullSizedPicture.png")
    dynamodb = boto3.resource('dynamodb')
    table = dynamodb.Table(structuraGeneralSiteTable)
    table.put_item(Item = item)
def exists(path):
    r = requests.head(path)
    return r.status_code == requests.codes.ok

def getProfile(userName,public=True):
    dynamodb = boto3.resource('dynamodb')
    table = dynamodb.Table('webProfiles')
    try:
        response = table.get_item(
            Key={
                'name': userName
            })
    except:
        response={"Item":{
                'name': userName,
                'Discord': "",
                'Ko-Fi': "",
                'Paetron': "",
                'Twitch': "",
                "Youtube":""}}
    data={}
    data["profile"]=response['Item']
    table = dynamodb.Table(structuraGeneralSiteTable)
    if public:
        response = table.query(
            IndexName='Creator-index',
            KeyConditionExpression=Key('Creator').eq(userName),
            FilterExpression=Attr('Visible').eq(True)
            )
    else:
       response = table.query(
            IndexName='Creator-index',
            KeyConditionExpression=Key('Creator').eq(userName) 
            ) 
    data["items"]=response['Items']
    
    retval={
            'statusCode': 200,
            'headers':corsHeaders,
            'body': json.dumps(data, default=float)
        }
    return retval
    
def signedProfile(headder):
    decoded = verifyToken(headder["token"])
    if decoded["auth"]:
        userName=decoded["json"]["username"]
        public=False
    else:
        userName=headder["filter"]
        public=True
    
    
    return getProfile(userName,public=public)
    
def deleteItem(headder):
    decoded = verifyToken(headder["token"])
    if decoded["auth"]:
        dynamodb = boto3.resource('dynamodb')
        table = dynamodb.Table(structuraGeneralSiteTable)
        guid = headder["filter"]
        response = table.get_item(Key={'GUID': guid})
        itemData = response["Item"]
        if decoded["json"]["username"] == itemData["Creator"]:
            s3Client = boto3.client('s3')
            PREFIX=guid+"/"
            response = s3Client.list_objects_v2(Bucket="structuralab.com", Prefix=PREFIX)
            if "Contents" in response.keys():
                for object in response['Contents']:
                    s3Client.delete_object(Bucket="structuralab.com", Key=object['Key'])
            table.delete_item(Key={'GUID': guid})
            return {'statusCode': 200,
                    'headers':corsHeaders,
                    'body': json.dumps(f"Sucessfully deleted {guid}")
                    }
    else:
        errorResponse("","Failed Authentication!")
        public=True
def fixImageSizes(headder):
    decoded = verifyToken(headder["token"])
    if decoded["auth"]:
        imageType = headder["imagetype"]
        s3_client = boto3.client('s3')
        match imageType:
            case "profileIcon":
                username=decoded["json"]["username"]
                tempGuid=uuid.uuid4()
                download_path = '/tmp/{}{}'.format(tempGuid, "profilePic.png")
                upload_path  = '/tmp/{}{}'.format(tempGuid, "resized_profilePic.png")
                s3_client.download_file("structuralab.com", f"Profiles/{username}/profilePic.png", download_path)
                resize_image(download_path, upload_path,64)
                s3_client.upload_file(upload_path, "structuralab.com", f"Profiles/{username}/profilePic.png")
            case "thumbnail":
                guid=headder["filter"]
                dynamodb = boto3.resource('dynamodb')
                table = dynamodb.Table(structuraGeneralSiteTable)
                table.update_item(Key={'GUID': guid},
                UpdateExpression="set pickUploaded =:b",
                ExpressionAttributeValues={":b": True},
                )
                download_path = '/tmp/{}{}'.format(guid, "fullSizedPicture.png")
                upload_path  = '/tmp/{}{}'.format(guid, "resized_fullSizedPicture.png")
                upload_path_thumbnail  = '/tmp/{}{}'.format(guid, "resized_thumnail.png")
                print(f"{guid}/fullSizedPicture.png")
                s3_client.download_file("structuralab.com", f"{guid}/fullSizedPicture.png", download_path)
                resize_image(download_path, upload_path,1080)
                resize_image(download_path, upload_path_thumbnail,250)
                s3_client.upload_file(upload_path, "structuralab.com", f"{guid}/fullSizedPicture.png")
                s3_client.upload_file(upload_path_thumbnail, "structuralab.com", f"{guid}/thumbnail.png")
                
                
                
        return {'statusCode': 200,
                'headers':corsHeaders,
                'body': json.dumps(f"Sucessfully updated")
                }
    else:
        errorResponse("","Authentication Failed!")
    
def resize_image(image_path, resized_path,maxSize):
    with Image.open(image_path) as image:
        imgSize=image.size
        scale=(maxSize/max(imgSize)) 
        newSize = [int(imgSize[0]*scale),int(scale*imgSize[1])]
        image.thumbnail(newSize)
        image.save(resized_path)
def generateItemHTML(data,bucket):
    with open("itemPageTemplate.html") as templateFile:
        template=templateFile.read()
    guid=data["GUID"]
    visible=""
    if data["Visible"]:
        visible="checked"
    for key in data.keys():
        if type(data[key]) is str:
            data[key]=html.escape(data[key])
    structureHTML=""
    for structureName in data["structureFiles"].keys():
        structureHTML+=f'<a class="show" href="{data["structureFiles"][structureName]}">{data["Name"]}.mcstructure</a>'
    nameTagHTML=""
    materialsSorted=dict(sorted(data["MaterialsList"].items(), key=lambda x:x[1],reverse=True))
    print(materialsSorted)
    materialsListHTML=f'<h4 class="itemCountH">Item Name</h4><h4 class="itemCountH">Number of Items</h4><h4 class="itemCountH">Stacks (round up)</h4><h4 class="itemCountH">Shulkers (round up)</h4>\n'
    for materialName in materialsSorted:
        numItems=data["MaterialsList"][materialName]
        stacks=ceil(data["MaterialsList"][materialName]/64)
        shulkers=ceil(data["MaterialsList"][materialName]/(64*27))
        materialsListHTML+=f'<h4 class="itemName">{materialName}</h4><h4 class="itemName">{numItems}</h4><h4 class="itemName">{stacks}</h4><h4 class="itemCount">{shulkers}</h4>\n'
    print(materialsListHTML)
    showThumb=" showInline"
    showYoutube=" hide"
    
    pictureURL=f'src="https://s3.us-east-2.amazonaws.com/structuralab.com/{guid}/fullSizedPicture.png"'
    catSel={"Farms":"","Buildings":"","Terrain":"","Villager":"","Storage":"","Flying":"","Furnaces":"","Redstone":"","Statues":"","Misc":""}
    catSel[data["Category"]]="selected"
    youtube=""
    youtubeID=""
    if "youtube" in data.keys():
        id = data["youtube"].split("/")[-1]
        if len(id)>5:
            youtube = data["youtube"]
            youtubeID = id
            showThumb="hide"
            showYoutube=" showInline"
            pictureURL=""
        
    StructuraFile=""
    if "StructuraFile" in data.keys():
        StructuraFile=data["StructuraFile"].replace("+","%").replace(" ","+")
        
    dt= datetime.datetime.fromtimestamp(int(data["date"]))
    result = template.format(
        metatitle=f"Structura Lab: {data['Name']}",
        title=data['Name'],
        date=dt.strftime("%m/%d/%Y, %H:%M:%S"),
        thumbURL=pictureURL,
        description=data["Description"],
        farmSel=catSel["Farms"],
        buildSel=catSel["Buildings"],
        terSel=catSel["Terrain"],
        vilSel=catSel["Villager"],
        storSel=catSel["Storage"],
        furnSel=catSel["Furnaces"],
        flySel=catSel["Flying"],
        redSel=catSel["Redstone"],
        staSel=catSel["Statues"],
        miscSel=catSel["Misc"],
        youtubeURL=youtube,
        youtubeID=youtubeID,
        visiblity=visible,
        showThumb=showThumb,
        showYoutube=showYoutube,
        creator=data["Creator"],
        StructuraPackLink=StructuraFile,
        structureFileDiv=structureHTML,
        nameTagsDiv=nameTagHTML,
        materialsListDIV=materialsListHTML
        )
    editIndex=0
    
    if "edits" in data.keys():
        editIndex=data["edits"]
    editIndex+=1
    os.makedirs(f'/tmp/{data["GUID"]}',exist_ok=True)
    dynamodb = boto3.resource('dynamodb', region_name="us-east-2")
    table = dynamodb.Table(structuraGeneralSiteTable)
    response = table.get_item(Key={"GUID":data["GUID"]})
    itemData = response["Item"]
    itemData["edits"] = editIndex
    if not("downloads" in itemData.keys()):
        itemData["downloads"]=1
        itemData["favorites"]=1
    
    score = calculateRank(itemData)
    itemData["rank"]=score
    table.put_item(Item = itemData)
    filename=f'{data["GUID"]}/item1.html'
    bucket.put_object(Key=filename,Body=result,ContentType='text/html',ContentDisposition= "inline")
    filename=f'{data["GUID"]}/item{editIndex}.html'
    bucket.put_object(Key=filename,Body=result,ContentType='text/html',ContentDisposition= "inline")
    return [filename, data["Visible"]]

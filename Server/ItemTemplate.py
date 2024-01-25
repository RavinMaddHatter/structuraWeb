from math import ceil
import os
import datetime
def writeItemPage(data):
    with open("itemPageTemplate.html") as templateFile:
        template=templateFile.read()
    pictureURL=f'https://s3.us-east-2.amazonaws.com/structuralab.com/{data["GUID"]}/fullSizedPicture.png'
    visible="false"
    if data["Visible"]:
        visible="true"
    structureHTML=""
    for structureName in data["structureFiles"].keys():
        structureHTML+=f'<a class="show" href="data["structureFiles"][structureName]">{data["Name"]}.mcstructure</a>'
    nameTagHTML=""
    materialsSorted=dict(sorted(data["MaterialsList"].items(), key=lambda x:x[1],reverse=True))
    materialsListHTML=f'<h4 class="itemCountH">Item Name</h4><h4 class="itemCountH">Number of Items</h4><h4 class="itemCountH">Stacks (round up)</h4><h4 class="itemCountH">Shulkers (round up)</h4>\n'
    for materialName in materialsSorted:
        numItems=data["MaterialsList"][materialName]
        stacks=ceil(data["MaterialsList"][materialName]/64)
        shulkers=ceil(data["MaterialsList"][materialName]/(64*27))
        materialsListHTML+=f'<h4 class="itemName">{materialName}</h4><h4 class="itemName">{numItems}</h4><h4 class="itemName">{stacks}</h4><h4 class="itemCount">{shulkers}</h4>\n'
    showThumb=" showInline"
    showYoutube=" hide"
    dt= datetime.datetime.fromtimestamp(data["date"])
    result = template.format(
        metatitle=f"Structura Lab: {data['Name']}",
        title=data['Name'],
        date=dt.strftime("%m/%d/%Y, %H:%M:%S"),
        thumbURL=pictureURL,
        description=data["Description"],
        category=data["Category"],
        youtubeURL=data["youtube"],
        visiblity=visible,
        showThumb=showThumb,
        showYoutube=showYoutube,
        creator=data["Creator"],
        StructuraPackLink=data["StructuraFile"],
        structureFileDiv=structureHTML,
        nameTagsDiv=nameTagHTML,
        materialsListDIV=materialsListHTML
        )
    os.makedirs(f'tmp/{data["GUID"]}',exist_ok=True)
    filename=f'tmp/{data["GUID"]}/item.html'
    with open(filename, "w") as text_file:
        text_file.write(result)

data={
    "item": {
        "date": 1705411095,
        "Creator": "maddhatter",
        "StructuraFile": "https://s3.us-east-2.amazonaws.com/structuralab.com/3aa08a32-c35e-474a-959d-d4c71837145c/Question and Answer Door.mcpack",
        "GUID": "3aa08a32-c35e-474a-959d-d4c71837145c",
        "youtube": "",
        "Visible": True,
        "Description": "This is a strange redstone door that works by displaying a question in the form of an item in the dropper with a button on it. then dropping the item in a filter line. that is locked by the lecturn. The book in the lecturn must have 32 pages for this to work.The answer is in the book the player submits their answer by pushing the button for that question. The concept is inspired by the Ravenclaw common room password.",
        "Category": "Buildings",
        "structureFiles": {
            "Question and answer book door.mcstructure": "https://s3.us-east-2.amazonaws.com/structuralab.com/3aa08a32-c35e-474a-959d-d4c71837145c/Question and answer book door.mcstructure"
        },
        "MaterialsList": {
            "Smooth Stone": 230,
            "Dark Oak Planks": 23,
            "Redstone Torch": 18,
            "Pumpkin": 2,
            "Spruce Button": 2,
            "Glass": 10,
            "Barrel": 5,
            "Lectern": 1,
            "Composter": 2,
            "Furnace": 11,
            "Dropper": 7,
            "Redstone Dust": 30,
            "Comparator": 15,
            "minecraft:clay": 2,
            "Iron Door": 2,
            "Observer": 1,
            "Repeater": 13,
            "Hopper": 32,
            "Noteblock": 3
        },
        "Name": "Question and Answer Door"
    }
}
writeItemPage(data["item"])

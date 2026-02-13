import uuid
import os
import shutil

def dump_strucures(world_file):
    import amulet
    import zipfile
    folder = uuid.uuid4()
    temp_world =os.path.join("tmp",str(folder).replace("-",""))
    os.makedirs(temp_world)
    with zipfile.ZipFile(world_file, 'r') as zip_ref:
        zip_ref.extractall(temp_world)
    os.makedirs(os.path.join(temp_world,"structures"))
    exports = []
    level = amulet.load_level(temp_world)
    with zipfile.ZipFile(f"{temp_world}.zip", 'w', zipfile.ZIP_DEFLATED) as zipf:
        for entry in level.level_wrapper.level_db.keys():
            if "structuretemplate" in str(entry):
                name=str(entry).split(":")[1]
                file_name = os.path.join(temp_world,"structures",f"name.mcstructure")
                print(f"saving {file_name}")
                exports.append(file_name)
                with open(file_name,"wb") as file:
                    file.write(level.level_wrapper.level_db.get(entry))
                zipf.write(file_name, arcname=os.path.basename(file_name))
    shutil.rmtree(temp_world)
    return f"{temp_world}.zip"
if __name__ =="__main__":
    world_file=os.path.join("tmp","test.mcworld")
    print(dump_strucures(world_file))

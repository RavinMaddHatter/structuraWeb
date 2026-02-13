from PIL import Image
import json
import numpy as np
import nbtlib 
from nbtlib.tag import Int, List,Compound,String
from copy import deepcopy



def closest(colors,color):
    color = np.array(color)
    distances = np.sqrt(np.sum((colors-color)**2,axis=1))
    index_of_smallest = np.where(distances==np.amin(distances))
    smallest_distance = colors[index_of_smallest]
    return smallest_distance 
def make_image(image_path,pallete,export_name):
    img = Image.open(image_path)
    colors = []
    for key in pallete:
        colors.append(list(map(int,key.split(","))))
    colors = np.array(colors)
    new_img = np.asarray(img.resize((128, 128)))
    block_pallet=[]
    data=np.zeros((128,128),dtype=int)
    for x in range(128):
        for y in range(128):
            
            color = new_img[x][y][:3]
            selected_color = tuple(closest(colors,color)[0])
            color_id = f"{selected_color[0]},{selected_color[1]},{selected_color[2]}"
            block=pallete[color_id][0]
            if not (block in block_pallet):
                block_pallet.append(block)
            data[y][x]=block_pallet.index(block)
    blockList = List[Int](data.flatten().tolist())
    shape=data.shape
    template = nbtlib.load("template.mcstructure", byteorder='little')
    template["size"][0]=Int(shape[0])
    template["size"][1]=Int(1)
    template["size"][2]=Int(shape[1])
    template["structure"]["block_indices"][0]=blockList
    template["structure"]["block_indices"][1]=List[Int]([-1]*data.size)
    num_blocks = len(block_pallet)
    temp_palette=template["structure"]["palette"]["default"]["block_palette"][0]
    ListBlocks=[]
    for i in range(num_blocks):
        blockItem=deepcopy(temp_palette)
        blockItem["name"] = String(block_pallet[i])
        ListBlocks.append(blockItem)
    template["structure"]["palette"]["default"]["block_palette"]=List[Compound](ListBlocks)
    template.save("{export_name}.mcstructure")
    
    return data
if __name__ =="__main__"
    with open('blockLookups.json', 'r') as f:
        colors_lookup = json.load(f)
    data = make_image('AAlogo.png',colors_lookup,"AA")



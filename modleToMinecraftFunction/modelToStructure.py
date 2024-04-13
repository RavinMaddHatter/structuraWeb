import trimesh
import numpy as np
import os
import shutil
import nbtlib #import LevelDatNbt as worldNBT
from nbtlib.tag import Int, List
from trimesh.transformations import euler_matrix
import time


class modelConverter:
    def __init__(self,fileName):
        self.fileName = fileName
        self.defName=os.path.basename(self.fileName).split(".")[0]
        self.mesh = trimesh.load(self.fileName) #import a mesh
        self.meshdims = self.mesh.bounding_box.primitive.extents
        self.pitch = self.meshdims[2]/320
    def scaleMesh(self,maxSize):
        self.pitch = max(self.meshdims)/(maxSize-1)
    def rotate(rotx,roty,rotz):
        HTM=a=euler_matrix(xrot*numpy.pi/180,yrot*numpy.pi/180,zrot*numpy.pi/180)
        self.mesh.apply_transform(HTM)
    def makeModel(self,folder=""):
        matrix = np.array(self.mesh.voxelized(pitch=self.pitch).matrix)
        blocks = matrix.astype(Int)
        blockList = List[Int](blocks.flatten().tolist())
        
        shape=blocks.shape
        template = nbtlib.load("template.mcstructure", byteorder='little')
        template["size"][0]=Int(shape[0])
        template["size"][1]=Int(shape[1])
        template["size"][2]=Int(shape[2])
        template["structure"]["block_indices"][0]=blockList
        template["structure"]["block_indices"][1]=List[Int]([-1]*blocks.size)
        if len(folder)>0:
            os.makedirs(folder, exist_ok=True)
        template.save(os.path.join(folder,self.defName+".mcstructure"))
        
        
    




if __name__ =="__main__":
    fileName=r"creeper2.stl"
    test = modelConverter(fileName)
    test.scaleMesh(100)
    test.makeModel("tmp")
    

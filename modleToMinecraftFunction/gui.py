from tkinter import DoubleVar,StringVar,IntVar, Label, Entry, Tk, Button
from tkinter import filedialog
import threading
import modelToStructure
YOffset=4
desiredSize=50
buildCenterX=0
buildCenterY=0
root = Tk()
root.title("Madhatter's Minecraft Model Maker")
FileGUI=StringVar()
FileGUI.set("creeper.stl")
sizeGui=IntVar()
sizeGui.set(desiredSize)
startHGui=IntVar()
startHGui.set(YOffset)

rotXGui=DoubleVar()
rotYGui=DoubleVar()
rotZGui=DoubleVar()
rotXGui.set(0)
rotYGui.set(0)
rotZGui.set(0)

outputGui=StringVar()
outputGui.set("")

def browseObj():
    FileGUI.set(filedialog.askopenfilename(filetypes = (("3D Model", "*.stl *.STL"), )))
def runThread():
    x = threading.Thread(target=run)
    x.start()
def run():
    outputGui.set("starting")
    fileName=FileGUI.get()
    xrot=rotXGui.get()
    yrot=rotYGui.get()
    zrot=rotZGui.get()
    desiredSize=sizeGui.get()
    converter = modelToStructure.modelConverter(fileName)
    converter.rotate(xrot,yrot,zrot)
    converter.scaleMesh(desiredSize)
    name = converter.makeModel("")
    outputGui.set("done")
    pass
runbutton=Button(root, text="Make My Structure",command=runThread)
getFileButton=Button(root, text="Browse model",command=browseObj)

fileLB=Label(root, text="3D file")
BaseLB=Label(root, text="Minecraft World")
fileEntry = Entry(root,textvariable=FileGUI)

maxSizeLB=Label(root, text="Max Size in Blocks")
maxDimEntry = Entry(root,textvariable=sizeGui)


OutputEntry = Entry(root,textvariable=outputGui,width=44)

rotXLabel=Label(root, text="Rotation About the X Axis")
rotYLabel=Label(root, text="Rotation About the Y Axis")
rotZLabel=Label(root, text="Rotation About the Z Axis")
rotXEntry = Entry(root,textvariable=rotXGui)
rotYEntry = Entry(root,textvariable=rotYGui)
rotZEntry = Entry(root,textvariable=rotZGui)

HeightOffGround= Entry(root,textvariable=startHGui)
HeightOffGroundLB=Label(root, text="Starting Y Level")
r=0
fileLB.grid(row=r,column=0)
fileEntry.grid(row=r,column=1)
getFileButton.grid(row=r,column=2)
r+=1
maxSizeLB.grid(row=r,column=0)
maxDimEntry.grid(row=r,column=1)
r+=1
HeightOffGround.grid(row=r,column=1)
HeightOffGroundLB.grid(row=r,column=0)
r+=1
rotXLabel.grid(row=r,column=0)
rotXEntry.grid(row=r,column=1)
r+=1
rotYLabel.grid(row=r,column=0)
rotYEntry.grid(row=r,column=1)
r+=1
rotZLabel.grid(row=r,column=0)
rotZEntry.grid(row=r,column=1)
r+=1



OutputEntry.grid(row=r,column=0,columnspan = 2)
r+=1
runbutton.grid(row=r,column=2)
root.mainloop() 



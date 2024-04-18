import pandas
import xml.etree.cElementTree as ET

entries=pandas.read_excel("Search Recomendations.xlsx")
root = ET.Element('Autocompletions')
for index, row in entries.iterrows():
    entry = ET.SubElement(root,"Autocompletion ")
    entry.set("term",row["Phrase"])
    entry.set("type",str(row["Include"]))
    entry.set("score",str(row["Score"]))
    entry.set("match","1")
#  <Autocompletion term="%term-title%" type="%type%" language=""/>


tree = ET.ElementTree(root)
ET.indent(tree, '  ')
tree.write("autocomplete.xml", encoding='utf-8', xml_declaration=True)

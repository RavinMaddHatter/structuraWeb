import requests
import re
youtubeURL_re="((?:https?:)?\/\/)?((?:www|m)\.)?(youtu)\.?be(-nocookie)?(.com)?\/((watch)|(embed)||(live))?\??v?=?\/?([a-zA-Z0-9\_\-]{5,20})"
youtubeURL_re="((?:https?:)?\/\/)?((?:www|m)\.)?((?:youtube(?:-nocookie)?\.com|youtu.be))(\/(?:[\w\-]+\?v=|embed\/|live\/|v\/)?)([\w\-]+)(\S+)?"
def checkYoutubeVideo(url):
    matches = re.findall(youtubeURL_re,url)
    if len(matches)>0:
        vid_id = matches[0][-2]
        thumnailURL = f"https://img.youtube.com/vi/{vid_id}/0.jpg"
        r = requests.head(thumnailURL)
        if r.status_code == requests.codes.ok:
            return f"https://youtu.be/{vid_id}"
    return ""
if __name__=="__main__":
    with open("youtubeURLTest.txt") as examples:
        for entry in examples:
            print(checkYoutubeVideo(entry))

const downloadMedia = function (url, fileName) {
  https.get(url, res => {
    // Image will be stored at this path
    const path = `${__dirname}/media/${fileName}`
    const filePath = fs.createWriteStream(path)
    res.pipe(filePath)
    filePath.on("finish", () => {
      filePath.close()
      console.log("Download Completed")
    })
  })
}

// Downloads the file, depending if it is a GIF or Photo (have to add videos!)
const manageMedia = function (mentionedTweets) {
  let allUrls = []
  mentionedTweets.includes.media.forEach(d => {
    // console.log(d)
    let fileName
    let mediaUrl
    switch (d.type) {
      case "animated_gif":
        fileName = `${d.media_key}${d.variants[0].url.slice(-4)}`
        mediaUrl = d.variants[0].url
        break
      case "photo":
        fileName = `${d.media_key}${d.url.slice(-4)}`
        mediaUrl = d.url
        break
      case "video":
        fileName = `${d.media_key}.mp4`
        // find the best quality video variant
        mediaUrl = d.variants.reduce((prevVideo, curVideo) => {
          if (curVideo.bit_rate == undefined) {
            return prevVideo
          }
          if (curVideo.bit_rate > prevVideo.bit_rate) {
            return curVideo.url
          }
        })
        break
    }
    allUrls.push(mediaUrl)
    // downloadMedia(mediaUrl, fileName)
  })
  console.log(allUrls)
}

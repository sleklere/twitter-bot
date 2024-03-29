require('dotenv').config({ path: __dirname + '/.env' })

class Bot {
  constructor(client) {
    this.twClientV2 = client
  }

  delay(seconds) {
    return new Promise(resolve => setTimeout(resolve, seconds * 1000))
  }

  async tweet(tweetText) {
    try {
      await this.twClientV2.tweet(tweetText)
    } catch (e) {
      console.log(e)
    }
  }

  async getOneTweet(tweetId) {
    const tweet = await this.twClientV2.singleTweet(tweetId, {
      expansions: 'attachments.media_keys',
      'tweet.fields': ['conversation_id'],
    })
    console.log(tweet)
    return tweet
  }

  async getTweets(query) {
    console.log('==========')
    console.log(`GET_TWEETS with query: ${query}`)
    console.log('==========')
    const response = await this.twClientV2.search(query, {
      expansions:
        'author_id,attachments.media_keys,entities.mentions.username,in_reply_to_user_id',
      'tweet.fields': ['conversation_id'],
    })
    return response
  }

  async getMentionedTweets() {
    const date = new Date('2023-01-01')
    return await this.twClientV2.userMentionTimeline('1523649543820267520', {
      end_time: date.toISOString(),
      max_results: 12,
      expansions:
        'author_id,attachments.media_keys,in_reply_to_user_id,referenced_tweets.id',
      'media.fields': ['alt_text', 'variants', 'url'],
      'tweet.fields': ['conversation_id'],
    })
  }

  async checkIfAlreadyReplied(conversation_id, authorId) {
    const search = await this.getTweets(`conversation_id:${conversation_id}`)
    const tweets = search.data.data
    if (search.data.meta.result_count === 0) {
      console.log('No conversation')
      return 3
    }
    for (const tw of tweets) {
      // check if the tw in the conversation is from the bot
      if (tw.author_id === process.env.APP_ID) {
        // check if it is a reply to the tw with the authorId from the arguments
        if (tw.in_reply_to_user_id === authorId) {
          console.log('Already replied!')
          return true
        }
      }
    }
    console.log("Didn't reply yet!")
    return false
  }

  async getMediaURLs(tweetId) {
    const tweet = await this.twClientV2.singleTweet(tweetId, {
      expansions: 'attachments.media_keys',
      'media.fields': ['variants', 'url'],
    })
    const tweetMediaCopy = tweet.includes?.media.slice()
    let mediaURLs = tweetMediaCopy?.map(mediaItem => {
      switch (mediaItem.type) {
        case 'animated_gif':
          return mediaItem.variants[0].url
        case 'photo':
          return mediaItem.url
        case 'video':
          // find the best quality video variant
          return mediaItem.variants.reduce((prevVideo, curVideo) => {
            if (curVideo.bit_rate == undefined) {
              return prevVideo
            }
            if (curVideo.bit_rate > prevVideo.bit_rate) {
              return curVideo.url
            }
          })
      }
    })
    return mediaURLs
  }

  async replyWithMediaUrls(mediaURLs, tweetId) {
    try {
      let replyText = `Enter this link/s to download your media:\n\n`
      mediaURLs.forEach(url => {
        replyText += `${url}\n`
      })
      await this.twClientV2.reply(replyText, tweetId)
      console.log('Replied to tweet')
    } catch (err) {
      console.log(err.data.detail)
    }
  }
}

module.exports = Bot

const fs = require('fs');
const request = require('request');
const cheerio = require('cheerio');
const requestPromise = require('request-promise');
const Json2csvParser = require('json2csv').Parser;

const URLS = [
  'https://www.imdb.com/title/tt6565702/', 
  'https://www.imdb.com/title/tt5114356/',
  'https://www.imdb.com/title/tt0111161/',
  'https://www.imdb.com/title/tt0068646/',
  'https://www.imdb.com/title/tt0071562/',
  'https://www.imdb.com/title/tt0108052/',
];

const HEADER = {
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3',
  'Accept-Encoding': 'gzip, deflate, br',
  'Accept-Language': 'zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7,zh-CN;q=0.6,la;q=0.5',
  'Cache-Control': 'max-age=0',
  'Connection': 'keep-alive',
  'Upgrade-Insecure-Requests': '1',
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.169 Safari/537.36'
};

(async () => {
  let moviesData = [];

  for (let movie of URLS) {
    const response = await requestPromise({
      uri: movie,
      headers: { ...HEADER, 'Host': 'www.imdb.com'},
      gzip: true
    });
    
    // Data Parsing
    let $ = cheerio.load(response);

    let title = $('div[class="title_wrapper"] > h1').text().trim();
    let rating = $('div[class="ratingValue"] > strong > span').text();
    let poster = $('div[class="poster"] > a > img').attr('src');
    let totalRatings = $('div[class="imdbRating"] > a').text();
    let releaseDate = $('a[title="See more release dates"]').text().trim();

    let genres = [];
    $('div[class="title_wrapper"] a[href^="/search/title"]').each((i, ele) => {
      let genre = $(ele).text();
      genres.push(genre);
    });

    moviesData.push({
      title,
      rating,
      poster,
      totalRatings,
      releaseDate,
      genres
    });

    // Download Images
    let file = fs.createWriteStream(`./images/Poster - ${title}.jpg`);

    await new Promise((resolve, reject) => {
      let stream = request({
        uri: poster,
        headers: HEADER,
        gzip: true
      })
      .pipe(file)
      .on('finish', () => {
        console.log(`${title} has finished Downloading the image.`);
        resolve();
      })
      .on('error', (error) => {
        reject(error);
      })
    })
    .catch(error => {
      console.log(`${title} has an error on download. ${error}`);
    });

    // Write date to files
    const json2csvParser = new Json2csvParser();
    const csv = json2csvParser.parse(moviesData);

    fs.writeFileSync('./data/data.csv', csv, 'utf-8');
    fs.writeFileSync('./data/data.json', JSON.stringify(moviesData), 'utf-8');

    debugger;
  }
})();

const fs = require('fs');

fs.readFile('./data/enriched_covid_df.json.json', (err, data) => {
  console.log(err);
  fs.writeFileSync('./data/enriched_covid_df.json_spaced.json', JSON.stringify(JSON.parse(data), null, 2))
})

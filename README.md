# Covid-19 Risk Analysis

This repository contains a pipeline for analysis on Covid-19 risk factors. 

## Hypothesis
AI can benefit researchers by extracting and visualizing information in the most efficient and relevant manner at scale. In the absence of expert feedback and annotations, we have built/provided a platform that extracts and ranks relevant info with potential for improvement in the future by taking advantage of expert annotation.

## Solution
The pipeline consists of: 
- Parsing 60,000+ papers related to the coronavirus
- Extracting risk factors from covid-19 papers
- Ranking excerpts from papers based on the pertinence of their information related to covid-19. 
- Web app you can find [here](www.no_link.com) that visualizes the excerpts. 
- Here is a sample <img src="platform_sample.png">
- We also have a question information retrieval system implemented in the Risk Factor Analysis notebook.
	- This end of the pipeline has not been hosted on the web app yet.

## Try it out

You can try out the web app for yourself. You may either use npm or yaml to start the react app.
```bash
git clone https://github.com/mahtablci1/Kaggle.git
cd Kaggle
cd viz/react-viz
npm install
npm start
```


## Acknowledgement
We would like to thank Bryan Romer and Serge Myroshnychenko for helping us improve this platform!

## Contact
If you have any questions, feel free to reach out to us at:
- Nikhil Budathoki : nbudatho@uwaterloo.ca
- Keshan Vardachari: keshav.varadachari@thomsonreuters.com
- Maria Kamali: maria.kamali@thomsonreuters.com

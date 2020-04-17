import React, { Component } from 'react';
import './App.css';
import PaperComponent from './Paper/Paper.js';
// import data from './datas/risk_covid_join.json'
// import diabete_data from "./datas/diabete.json";
// import tuberclosis_data from "./datas/tuberclosis.json";
// import pregnan_data from "./datas/pregnan.json";
// import smoke_data from "./datas/smoke.json";
import enriched_data from "./datas/enriched_covid_df.json";
// import enriched_data from "./datas/enriched_covid_df224.json";

// const rankedRiskFactors = {
// 	pregnancy: pregnan_data,
// 	smoking: smoke_data,
// 	diabetes: diabete_data,
// 	tuberculosis: tuberclosis_data,
// }

// const riskFactors = [
// 	"pregnancy", "smoking", "diabetes", 'tuberculosis',
// 	"hypertension", "race", "heart disease", "nursing home",
// 	"cancer", "immigration", "elderly", "education",
// 	"insurance", "neonates", "income",
// 	"ethnicity", "housing", "health workers", "hospital staff", "staff"
// ];

function unstemRiskFactor(stemmedRiskFactor) {
	if (stemmedRiskFactor === 'pregnan') return 'pregnancy';
	else if (stemmedRiskFactor === 'smok' || stemmedRiskFactor === 'lung' || stemmedRiskFactor === 'immun') return 'smoking';
	else if (stemmedRiskFactor === 'tubercul' || stemmedRiskFactor === 'tb' || stemmedRiskFactor === 'sputum') return 'tuberculosis';
	else if (stemmedRiskFactor === 'diabete') return 'diabetes';
	else if (stemmedRiskFactor === 'comorbidit') return 'comorbidity';
	else if (stemmedRiskFactor === 'hyperten') return 'hypertension';
	return stemmedRiskFactor;
}

function unstemDesign(stemmedDesign) {
	return stemmedDesign;
}

class App extends Component {
	riskFactors;


	constructor() {
		super();
		// const factors = this.getPaperRiskFactors(enriched_data[0])
		// console.log('factors', factors);

		console.log('unclean', enriched_data);
		const papers = this.cleanPapers(enriched_data);
		console.log('clean', papers);

		this.state = {
			unclean: enriched_data, // raw data
			cleaned: papers, // raw data cleaned - normalized fields (unique/flat lists, string -> array etc)
			filtered: papers, // cleaned data filtered by filters (risk factor)
			winStart: 0, // paginated window of filtered papers to show
			winSize: 1,
		}

		this.filterByRiskFactor = this.filterByRiskFactor.bind(this);
	}

	getPaperRiskFactors(paper) {
		let _factors = []
		for (const prop in paper) {
			const match = prop.match(/has_(.*)\?/)
			if (match) {
				const [,factor] = match;
				_factors.push(factor);
			}
		}
		_factors = [...new Set(_factors)];
		const factors = _factors.filter(f => paper[`has_${f}?`])
		return factors;
	}

	cleanPapers(data) {
		this.setIds(data);
		this.sortPapers(data)
		this.cleanRiskFactors(data);
		this.cleanDesigns(data)
		return data;
	}

	setIds(papers) {
		papers.forEach((p, idx) => p.id = idx)
	}

	sortPapers(papers, sortBy = 'max_rank') {
		return papers.sort((p1, p2) => {
			return (p2[sortBy] || 0) - (p1[sortBy] || 0);
		})
	}

	cleanRiskFactors(papers) {
		this.riskFactors = new Set();
		papers.forEach(p => {
			if (typeof p.risk_factors === 'string') {
				p.risk_factors = this.handleStringRiskFactors(p.risk_factors);
			}
			if (!Array.isArray(p.risk_factors)) {
				console.error('risk_factor column must be array of strings!', p.risk_factors);
			}
			p.risk_factors = this.makeFlatUnique(p.risk_factors);
			p.risk_factors = p.risk_factors.map(f => unstemRiskFactor(f.trim()));
			p.risk_factors.forEach(f => this.riskFactors.add(f));
		});
	}

	cleanDesigns(papers) {
		papers.forEach(p => {
			p.design = this.makeFlatUnique(p.design).map(d =>unstemDesign(d));
		})
	}

	makeFlatUnique(arr) {
		return [...new Set(arr.flat())]
	}

	handleStringRiskFactors(risk_factors) {
		// use double quotes
		risk_factors = risk_factors.replace(/'/g, '"');
		// remove duplicates
		risk_factors = JSON.parse(risk_factors);
		return risk_factors
	}

	render() {
		const papers = this.state.filtered.slice(this.state.winStart, this.state.winStart + this.state.winSize);

		return (
			<div>

				<header>
					<div className="app-header">
						<h1>What do we know about COVID-19 risk factors? What have we learned from epidemiological studies?</h1>
					</div>

					<div className="searchbar">
						<h4>Filters:</h4>
						<div className="filters">
							<label>
								Risk Factor:
								<select onChange={this.filterByRiskFactor}>
									<option value=""></option>
									{this.getRiskFactorOptions()}
								</select>
							</label>
						</div>
					</div>

				</header>

				<div>
					{papers.map(paper => {
						return (<PaperComponent key={paper.id} paper={paper}/>);
					})}
				</div>

				<button onClick={this.loadMoreHandler}>Load More</button>
				<p>{this.state.winSize}</p>

			</div>
		);
	}

	filterByRiskFactor({target}) {
		debugger;
		const factor = target.value;
		const filtered = factor
			? this.state.cleaned.filter(p => p[`has_${factor}?`])
			: this.state.cleaned
		const sortBy = factor ? `${factor}_rank` : undefined
		this.sortPapers(filtered, sortBy)
		this.setState({
			filtered,
			winSize: 10
		})
	}

	getRiskFactorOptions() {
		return [...this.riskFactors].map(f => {
			const factorLabel = f[0].toUpperCase() + f.slice(1);
			return (
				<option
				  key={f}
					value={f}
					className="title-case">
					{factorLabel}
				</option>
			)
		})
	}

	loadMoreHandler = () => {
		this.setState({
			winSize: this.state.winSize + 10
		})
	}

}

export default App;

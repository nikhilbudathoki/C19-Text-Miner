import React, { Component } from 'react';
import './App.css';
import PaperComponent from './Paper/Paper.js';
import enriched_data from "./datas/enriched_covid_df.json";

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
		console.log('unclean', enriched_data);
		const papers = this.cleanPapers(enriched_data);
		console.log('clean', papers);

		this.state = {
			unclean: enriched_data, // raw data
			cleaned: papers, // raw data cleaned - normalized fields (unique/flat lists, string -> array etc)
			filtered: papers, // cleaned data filtered by filters (risk factor)
			winStart: 0, // paginated window of filtered papers to show
			winSize: 10,
		}

		this.filterByRiskFactor = this.filterByRiskFactor.bind(this);
	}

	// only for temporary measures
	removeDuplicates(papers) {
		var filtered_papers = [];
		var filtered_ids = [];

		papers.forEach((p, idx) => {
			if (!filtered_ids.includes(p.doc_id)) {
				filtered_papers.push(p);
				filtered_ids.push(p.doc_id);
			}
		});
		return filtered_papers;
	}

	getPaperRiskFactors(paper) {
		let _factors = []
		for (const prop in paper) {
			const match = prop.match(/has_(.*)\?/)
			if (match) {
				const [, factor] = match;
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
			p.design = this.makeFlatUnique(p.design).map(d => unstemDesign(d));
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
		const papers = this.removeDuplicates(this.state.filtered).slice(this.state.winStart, this.state.winStart + this.state.winSize);

		return (
			<div>

				<header>
					<div className="app-header">
						<nav>
							<a target="_blank" href="https://github.com/mahtablci1/Kaggle">View Repo</a>

						</nav>

						<h1>Risk Factors of COVID-19</h1>
					</div>

					<div className="searchbar">
						<div className="filters">
							<div className="label">
								<p>Risk Factor:</p>
							</div>

							<label>

								<select onChange={this.filterByRiskFactor}>
									<option value=""></option>
									{this.getRiskFactorOptions()}
								</select>
							</label>
						</div>
					</div>

				</header>

				<div className="papers">
					<p className="result-count">Displaying <strong>{this.state.winSize}</strong> of <strong>{this.state.filtered.length}</strong> papers</p>
					{papers.map(paper => {
						return (<PaperComponent key={paper.id} paper={paper} />);
					})}
					<button className="load-paper" onClick={this.loadMoreHandler}>Load More</button>

				</div>



			</div>
		);
	}

	filterByRiskFactor({ target }) {
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

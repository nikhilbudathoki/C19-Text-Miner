import React, { Component } from 'react';
import './Paper.css';

const handleForce = (data, fileInfo) => console.log(data, fileInfo);

const riskFactorColors = {
	hypertension: '',
	cancer: '',
	diabetes: '',
	'pulmonary disease': '',
	pregnancy: '',
	copd: '',
	'race/ethnicity': '',
	tuberculosis: '',
	neonates: '',
	'liver disease': '',
	'smoking': '',
}

/**
 * Receives prop with paper DTO.
 */
class PaperComponent extends Component {

	constructor(props) {
		super(props)

		if (props.paper.doc_id === "5dc4268a42adf3d5c55c87b7f6518de600b057c5") {
			props.paper.relevant_section = `Breastfeeding is not contraindicated, based on current published guidelines – a
			retrospective analysis of COVID-19 in pregnancy showed that none of the women had
			detectable viral loads of SARS-CoV-2 in breastmilk. Regardless, if the patient chooses to
			breastfeed, a face mask should be worn due to the close proximity between mother and child
			to reduce the risk of droplet transmission. The presence of coronavirus antibodies in
			breastmilk depends on the gestation at which maternal infection occurred and if there was
			any preceding use of high-dose corticosteroids which could suppress maternal antibody
			responses`;
		}

		this.state = {
			paper: props.paper,
			excerptName: 'relevant_section',
			excerptFrags: null,
			excerptFragWindow: { start: null, end: null, startCreep: 1, endCreep: 1 },
			noExcerpt: false
		};
		this.state.paper.scibert_summary = this.state.paper.scibert_summary || 'Not Extracted Yet';

		const [frags, window] = this._makeExcerptHighlightedTemplate()
		this.state.excerptFrags = frags;
		this.state.excerptFragWindow = { ...this.state.excerptFragWindow, ...window };


		this.setExcerpt = this.setExcerpt.bind(this);
		this.onBefore = this.onBefore.bind(this);
		this.onAfter = this.onAfter.bind(this);
	}


	// todo: skip splitting when abstract is retrieved as string[] directly
	render() {

		let {
			doc_id, journal, title, authors, doi,
			text_body, abstract, design, risk_factors,
			publish_time,
		} = this.state.paper;

		const excerptName = this.state.excerptName;
		const link = `http://doi.org/${doi}`;
		return (
			<div className="paper-container">
				<div className="paper-metadata">
					<h2>{title}</h2>
					<h4>Journal:</h4> <span>{journal}</span>
					<h4>Publication Date:</h4> <span>{(new Date(publish_time)).toUTCString()}</span>

					<h4>Doi:</h4> <span>{doi}</span>
					<h4>Design:</h4> <span className="title-case">{this.showButtons(design)}</span>
					<h4>Relevant Risk Factors:</h4> {this.showButtons(risk_factors)}
					<a target="_blank" href={link}>View Reference</a> <span></span>

				</div>

				<div className="paper-data">
					<div className="paper-summary">
						<h3>
							<label>
								<span className={excerptName === 'relevant_section' ? 'active' : ''}>Relevant Snippet</span>
								<input name={`${doc_id}-excerpt`} type="radio" checked={excerptName === 'relevant_section'} onChange={this.setExcerpt.bind(this, 'relevant_section')} />
							</label>

							<label>
								<span className={excerptName === 'scibert_summary' ? 'active' : ''}>Extracted Summary</span> <input name={`${doc_id}-excerpt`} type="radio" checked={excerptName === 'scibert_summary'} onChange={this.setExcerpt.bind(this, 'scibert_summary')} /></label>
						</h3>

						<div className="content">
							<button onClick={this.onBefore}>View previous text</button>
							<div className="text">
								<p>{this.renderExcerpt()}</p>
							</div>
							<button onClick={this.onAfter}>View next text</button>

						</div>

					</div>
				</div>

			</div>
		)
	}

	renderExcerpt() {
		return this.state.noExcerpt
			? (<span>Not Extracted Yet</span>)
			: this.state.excerptFrags.filter((_, idx) => idx >= this.state.excerptFragWindow.start && idx <= this.state.excerptFragWindow.end);
	}

	onBefore() {
		this.setState({
			...this.state,
			excerptFragWindow: {
				...this.state.excerptFragWindow,
				start: Math.max(this.state.excerptFragWindow.start - this.state.excerptFragWindow.startCreep, 0),
				startCreep: this.state.excerptFragWindow.startCreep * 2
			}
		})
	}

	onAfter() {
		this.setState({
			...this.state,
			excerptFragWindow: {
				...this.state.excerptFragWindow,
				end: Math.min(this.state.excerptFragWindow.end + this.state.excerptFragWindow.endCreep, this.state.excerptFrags.length - 1),
				endCreep: this.state.excerptFragWindow.endCreep * 2
			}
		})

	}

	showButtons(stringArr) {
		return (
			<div className="btn-group-toggle" data-toggle="buttons">
				{stringArr.map(str => {
					return (
						<button
							key={str}
							className="btn btn-secondary active title-case">
							{str}

						</button>
					)
				})}
			</div>
		)

	}

	makeExcerptTemplate(excerptName) {
		const excerpt = this.state.paper[excerptName];
		if (!excerpt) {
			console.error('no excerpt')
			return;
		}

		const sentences = excerpt.split(/(?<=\.\s+)/);
		return sentences.map((sentence, idx) => (<span key={idx} className="sentence">{sentence}</span>));

	}

	_makeExcerptHighlightedTemplate(excerptName = this.state.excerptName) {
		let excerpt, match_indices;
		if (excerptName === 'relevant_section') {
			excerpt = this.state.paper.text_body;
			match_indices = this.state.paper.match_indices
		} else if (excerptName === 'scibert_summary') {
			return null;
		}


		return this.makeHighlightedFragments(match_indices, excerpt);
	}

	makeHighlightedFragments(match_indices, snippet) {
		match_indices.sort((a, b) => a - b)
		const ws = /(.*?)\W/g
		const frags = []
		const window = { start: null, end: null }
		for (let i = 0; i < match_indices.length; ++i) {
			const matchIdx = match_indices[i]
			frags.push(... this.makeSentenceFragments(snippet.slice(ws.lastIndex, matchIdx), i))
			ws.lastIndex = matchIdx;
			const match = ws.exec(snippet)
			if (match) {
				const [, kw] = match;
				frags.push((<span key={matchIdx} className="fragment keyword">{kw}</span>));
				if (i === 0) {
					window.start = frags.length - 2;
				}
				if (i === match_indices.length - 1) {
					window.end = frags.length;
				}
				ws.lastIndex--;
			} else {
				debugger;
				ws.lastIndex = matchIdx
			}
		}
		frags.push(...this.makeSentenceFragments(snippet.slice(ws.lastIndex), match_indices.length))
		return [frags, window];
	}

	makeSentenceFragments(frag, matchIdx) {
		const _frags = this._makeSentenceFragments(frag);
		const frags = _frags.map((_frag, idx) => (<span key={_frag + idx + matchIdx} className="fragment">{_frag}</span>))
		return frags;
	}

	_makeSentenceFragments(frag) {
		const sents = []
		const ws = /(.*?)\s/g
		let i = 0
		let end = 0;
		for (; i < frag.length; i = end) {
			end = i + 100;
			ws.lastIndex = end;
			const _args = ws.exec(frag)
			if (ws.lastIndex > end) {
				end = ws.lastIndex - 1
			}
			const sent = frag.slice(i, end)
			sents.push(sent)
		}
		return sents;
	}

	setExcerpt(excerptName) {
		if (this.state.excerptName !== excerptName) {
			const arr = this._makeExcerptHighlightedTemplate(excerptName)
			if (arr) {
				const [frags, window] = arr
				this.setState({
					...this.state,
					excerptFrags: frags,
					excerptFragWindow: { ...this.state.excerptFragWindow, ...window },
					excerptName,
					noExcerpt: false,
				})
			} else {
				this.setState({ noExcerpt: true, excerptName })
			}
		}
	}

};

export default PaperComponent;

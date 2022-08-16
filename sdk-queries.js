/* example use

	// create a couple filter expressions
	customerFirstName = eq("FirstName","A*")
	customerCountry = eq("Country","Brazil")
	
	q1 = new QueryBuilder("GET","Customer",customerFirstName)									// create the query object for the Customer resource, with an initial filter expression if desired
	q1 = q1.addFilter(customerCountry)															// add the second filter expression, previously stored in a variable
		.addFilter(any("City","Brasília","São Paulo"))											// add another filter expression in-line
		.join("Invoice")																		// join a related resource
		.addFilter( and(gte("InvoiceDate","2011-01-01"), eq("BillingCountry","Brazil") ))		// add a nested filter expression in-line
		.join("InvoiceLine")																	// join a related resource
		.join("Track")																			// join a related resource - last context
		.sort("Name","UnitPrice")																// sort results by these columns
		
	qString = q1.build(true)																	// retrieve the constructed query string
*/

 	// output:
	// /Customer/FirstName/A*/Country/Brazil/City/Brasília|São Paulo/Invoice/InvoiceDate/2011-01-01../BillingCountry/Brazil/InvoiceLine/Track?sort=Name,UnitPrice&separator=|



// *** expression builders - any/eq/between/gte/lte build expressions

// changes the default delimiter for any()
// can export only the setSDBSeparator function to avoid any namespace collisions
let SEPARATOR = '|';
const setSDBSeparator = (newSeparator) => {
	SEPARATOR = newSeparator;
}

// eq - single value select - give a column name and the value to filter on
// eg eq("CustomerId",1)
const eq = (col, value) => {
	return any(col, value);
}

// any - multi-value select - give a column name, and a list of n values to filter on
// eg any("CustomerId",1,2,3)
const any = (...values) => {
	
	if (values.length <= 1) { return '' }

	let s = null;
	for (const [i, v] of values.entries()) {
		if (v == null || v.length < 1) { return '' }
		s = i === 0 ? `${v}/` : s + `${v}${SEPARATOR}`
	}
	
	return s.slice(0, (0 - SEPARATOR.length) )
}


// between - select a range of values for a column
// eg between("CustomerId",1,10)
const between = (col, lower = undefined, upper = undefined) => {
	if ( (lower || upper) === undefined || col.length < 1 || col == null) { return '' }	

	const lb = lower === undefined ? '' : lower;
	const ub = upper === undefined ? '' : upper;
	return `${col}/${lb}..${ub}`
}

// gte - select value range greater than or equal to a term
// eg gte("CustomerId",10)
const gte = (col, lb) => {
	return between(col, lb)
}

// lte - select value range less than or equal to a term
// eg lte("CustomerId",10)
const lte = (col, ub) => {
	return between(col, undefined, ub)
}

// *** expression modifiers - operate on expressions created by expression builders
// not - negates a filter expression, can nest any/eq/and/between/gte/lte expressions
// eg not(eq("CustomerId",1))
const not = (colFilter) => { 
	if (colFilter == null || colFilter.length < 1) { return '' }
	return `~${colFilter}` 
}

// and - join multiple filter expressions together
// eg and( eq("FirstName","David"), any("City","Vancouver","Edmonton") )
const and = (...colFilters) => {

	if (colFilters.length === 0) { return '' }

	let s = '';
	for (const f of colFilters) {
		if (f == null || f.length < 1) { return '' }
		s += `${f}/`
	}
	return s.slice(0,-1)
}

// construct a SlashDB path, for a given HTTP method, with starting resource required, and optional filter for resource
class QueryBuilder {
	constructor(method,resource, filter = undefined, wildcard = '*') {
		if (!method) {
			throw new Error('method is undefined');
		}
		if (!resource) {
			throw new Error('resource is undefined');
		}
		
		
		this.method = method.toUpperCase();		
		this.resources = new Set([resource]);	// track all resources added to the query
		this.filters = { [resource] : filter};	// track the filter strings for each resource
		this.currContext = resource;
		
		this.wildcard = wildcard;
		this.separator = SEPARATOR;
		
		// will contain any query parameters that are set
		this.queryParams = {
			'sort' : undefined,
			'distinct' : false,
			'depth' : undefined,
			'stream' : false,
			'transpose' : false,
			'wantarray': false,
			// etc 
		};
	
		// the path as it is built up
		this.pathString = `/${resource}`;
		this.pathString += filter === undefined ? '' : `/${filter}`;
		
		// combines path and query parameters
		this.fullQueryString = null;
		
		// adds another resource to the path
		// only allow join method to be exposed for GET/PUT/DELETE operations
		if (this.method !== "POST") {
			this.join = (resource) => { 
				this.pathString = `${this.pathString}/${resource}`; 
				this.resources.add(resource);
				this.currContext = resource;
				return this.build()
			}
		}
	}
	
	// add a filter to the query for the current context, accepts strings created using filter expression functions
	addFilter(filterString) {
		this.pathString += `/${filterString}`; 
		if (this.filters[this.currContext] === undefined) {
			this.filters[this.currContext] = `${filterString}`;
		}
		else {
			this.filters[this.currContext] += `/${filterString}`;
		}		
			
		return this.build()
	}
	
	sort(...columns) {
		let s = '';
		if (columns.length < 1) {
			return this.build();
		}
		
		if (columns.length === 1 && columns[0] === false) {
			this.queryParams['sort'] = undefined;
		}
		
		else {
			for (const col of columns) {
				s += `${col},`;
			}
			s = s.slice(0,s.length-1);
			this.queryParams['sort'] = s;
		}
		return this.build()
	}
	
	
	depth(level) {
		this.queryParams['depth'] = level !== false ? level : undefined;
		return this.build();
	}

	distinct(toggle = true) {
		this.queryParams['distinct'] = toggle === true
		return this.build();
	}
	
	stream(toggle = true) {
		this.queryParams['stream'] = toggle === true
		return this.build();
	}
	
	transpose(toggle = true) {
		this.queryParams['transpose'] = toggle === true
		return this.build();
	}
	
	wantarray(toggle = true) {
		this.queryParams['wantarray'] = toggle === true
		return this.build();
	}
		

	// add separator to query string - only used internally
	#separator() {
		return this.separator !== ',' ? `&separator=${this.separator}` : '' ;
	}

	// add wildcard to query string - only used internally
	#wildcard() {
		return this.wildcard !== '*' ? `&wildcard=${this.wildcard}` : '';
	}	
	// generate the full query string - if no argument provided, will return the object, 
	// a truthy argument will return fullQueryString
	build(getQueryString=false) {
		let paramString = '';
		for (const p in this.queryParams) {
			if (this.queryParams[p] !== undefined && this.queryParams[p] !== false) {
				paramString += `${p}=${this.queryParams[p]}&`
			}
		}
		paramString = paramString.slice(0,paramString.length-1);	// chop trailing &
		paramString += this.#separator() + this.#wildcard();
		
		this.fullQueryString = paramString.length > 0 ? `${this.pathString}?${paramString}` : this.pathString;
		
		if (getQueryString) {
			return this.fullQueryString;
		}
		return this;
	}
}
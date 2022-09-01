import { DataDiscoveryFilter, eq, any, between, gte, lte, not, and, desc, asc, chgSeparator } from '../modules/datadiscoveryfilter.js';
import { SDB_FILTER_ERR_INVALID_COL_NAME, SDB_FILTER_ERR_INVALID_NUM_ARGS, SDB_FILTER_ERR_INVALID_TYPE, SDB_FILTER_ERR_EMPTY_STRING, 
    SDB_FILTER_ERR_INVALID_COMPARE_TYPE, SDB_FILTER_ERR_INVALID_RANGE, SDB_FILTER_ERR_NO_COL_FOUND,
    SDB_DDF_INVALID_RESOURCE, SDB_DDF_INVALID_FILTER, SDB_DDF_INVALID_SORT_COL,  SDB_DDF_INVALID_WILDCARD, SDB_DDF_INVALID_SEPARATOR,
    SDB_DDF_LIMIT_TYPE, SDB_DDF_OFFSET_TYPE, SDB_DDF_DEPTH_TYPE, SDB_DDF_XSDCARD_TYPE } from '../modules/datadiscoveryfilter.js';
import { SDB_SEPARATOR } from '../modules/datadiscoveryfilter.js';

beforeAll( () => {

});

describe('Composable functions unit tests', () => {
    
    // column parameter values to test
    const validCol = 'FirstName';
    const invalidCol_space = 'bad columnName';
    const invalidCol_notstring = 1;
    const invalidCol_firstcharnum = '1columnName';

    // value parameter values to test
    const strVal_1 = 'Helena';
    const strVal_2 = 'Bjørn';
    const intVal_1 = 2;
    const intVal_2 = 4;
    const invalidVal_type = [1];
    const invalidVal_empty = ' ';
    
    test('testing: eq()', () => {
   
        let result;
    
        // valid inputs, string or number
        result = eq(validCol, strVal_1);
        expect(result).toBe(`${validCol}/${strVal_1}`);
        result = eq(validCol, intVal_1);
        expect(result).toBe(`${validCol}/${intVal_1}`);
    
        // ERROR TESTS
    
        // too few args
        expect(() => {
            eq(validCol);
        }).toThrowError(SDB_FILTER_ERR_INVALID_NUM_ARGS);
    
        // valid inputs, but too many args
        expect(() => {
            eq(validCol, strVal_1, intVal_1);
        }).toThrowError(SDB_FILTER_ERR_INVALID_NUM_ARGS);
    
    
        // bad column name
        expect(() => {
            eq(invalidCol_space, strVal_1);
        }).toThrowError(SDB_FILTER_ERR_INVALID_COL_NAME);
    
        expect(() => {
            eq(invalidCol_notstring, strVal_1);
        }).toThrowError(SDB_FILTER_ERR_INVALID_COL_NAME);
        
        expect(() => {
            eq(invalidCol_firstcharnum, strVal_1);
        }).toThrowError(SDB_FILTER_ERR_INVALID_COL_NAME);       
    
        // non string/number values in parameters
        expect(() => {
            eq(validCol, invalidVal_type);
        }).toThrowError(SDB_FILTER_ERR_INVALID_TYPE);
    
        expect(() => {
            eq(validCol, invalidVal_empty);
        }).toThrowError(SDB_FILTER_ERR_EMPTY_STRING);
    
        expect(() => {
            eq(validCol, null);
        }).toThrowError(SDB_FILTER_ERR_INVALID_TYPE);    
    
        expect(() => {
            eq(validCol, undefined);
        }).toThrowError(SDB_FILTER_ERR_INVALID_TYPE);    
    
    
    });
    
    
    test('testing: any()', () => {
    
        let result;
        
        // valid inputs, strings/numbers can be mixed
        result = any(validCol, strVal_1, intVal_1, strVal_2);
        expect(result).toBe(`${validCol}/${strVal_1}${SDB_SEPARATOR}${intVal_1}${SDB_SEPARATOR}${strVal_2}`)
    
    
        // ERROR TESTS
    
        // too few args
        expect(() => {
            any(validCol);
        }).toThrowError(SDB_FILTER_ERR_INVALID_NUM_ARGS);
    
            
        // bad column name
        expect(() => {
            any(invalidCol_space, strVal_1, intVal_1, strVal_2);
        }).toThrowError(SDB_FILTER_ERR_INVALID_COL_NAME);
    
        expect(() => {
             any(invalidCol_notstring, strVal_1, intVal_1, strVal_2);
        }).toThrowError(SDB_FILTER_ERR_INVALID_COL_NAME);
       
        expect(() => {
            any(invalidCol_firstcharnum, strVal_1, intVal_1, strVal_2);
        }).toThrowError(SDB_FILTER_ERR_INVALID_COL_NAME);  

        // non string/number values in parameters
        expect(() => {
             any(validCol, strVal_1, invalidVal_type, intVal_1, strVal_2);
        }).toThrowError(SDB_FILTER_ERR_INVALID_TYPE);
    
        expect(() => {
             any(validCol, strVal_1, invalidVal_empty, intVal_1, strVal_2);
        }).toThrowError(SDB_FILTER_ERR_EMPTY_STRING);
        
        expect(() => {
            any(validCol, strVal_1, null);
        }).toThrowError(SDB_FILTER_ERR_INVALID_TYPE);    
    
        expect(() => {
            any(validCol, strVal_1, undefined);
        }).toThrowError(SDB_FILTER_ERR_INVALID_TYPE);    
    
    
    });
    
    test('testing: between()', () => {
    
        let result;
        
        // valid inputs, strings
        result = between(validCol, strVal_1, strVal_2);
        expect(result).toBe(`${validCol}/${strVal_1}..${strVal_2}`);
    
        // valid inputs, numbers
        result = between(validCol, intVal_1, intVal_2);
        expect(result).toBe(`${validCol}/${intVal_1}..${intVal_2}`);
    
        // valid input, lower bound only
        result = between(validCol, strVal_1);
        expect(result).toBe(`${validCol}/${strVal_1}..`);
    
        // valid input, upper bound only - null lower bound
        result = between(validCol, null, strVal_2);
        expect(result).toBe(`${validCol}/..${strVal_2}`);
    
        // valid input, upper bound only - undefined lower bound
        result = between(validCol, undefined, strVal_2);
        expect(result).toBe(`${validCol}/..${strVal_2}`);
    
    
        // ERROR TESTS
    
        // too few args
        expect(() => {
            between(validCol);
        }).toThrowError(SDB_FILTER_ERR_INVALID_NUM_ARGS);
    
    
        // valid inputs, but too many args
        expect(() => {
            between(validCol, strVal_1, strVal_2, strVal_1);
        }).toThrowError(SDB_FILTER_ERR_INVALID_NUM_ARGS);
        
        
        // bad column name
        expect(() => {
             between(invalidCol_space, strVal_1, strVal_2);
        }).toThrowError(SDB_FILTER_ERR_INVALID_COL_NAME);
    
        expect(() => {
            between(invalidCol_notstring, strVal_1, strVal_2);
       }).toThrowError(SDB_FILTER_ERR_INVALID_COL_NAME);   
    
        expect(() => {
            between(invalidCol_firstcharnum, strVal_1, strVal_2);
        }).toThrowError(SDB_FILTER_ERR_INVALID_COL_NAME);  

        // null input values
           expect(() => {
            between(validCol, null, null);
        }).toThrowError(SDB_FILTER_ERR_INVALID_RANGE);   
    
        // undefined input values
        expect(() => {
            between(validCol, undefined, undefined);
        }).toThrowError(SDB_FILTER_ERR_INVALID_RANGE);   
    
        // undefined & null input values
        expect(() => {
            between(validCol, null, undefined);
        }).toThrowError(SDB_FILTER_ERR_INVALID_RANGE);       
        
        // mixed value types - string and number
        expect(() => {
            between(validCol, strVal_1, intVal_1);
        }).toThrowError(SDB_FILTER_ERR_INVALID_COMPARE_TYPE);   
    
        // empty string value
        expect(() => {
            between(validCol, strVal_1, invalidVal_empty);
        }).toThrowError(SDB_FILTER_ERR_EMPTY_STRING); 
    
        // non string/number values in parameters
        expect(() => {
            between(validCol, invalidVal_type, invalidVal_type);
        }).toThrowError(SDB_FILTER_ERR_INVALID_TYPE); 
    
    
    
    });
    
    test('testing: gte()', () => {
    
        let result;
    
        // valid input, strings
        result = gte(validCol, strVal_1);
        expect(result).toBe(`${validCol}/${strVal_1}..`);
    
        // valid input, numbers
        result = gte(validCol, intVal_1);
        expect(result).toBe(`${validCol}/${intVal_1}..`);
    
        // ERROR TESTS
    
        // too few args
        expect(() => {
            gte(validCol);
        }).toThrowError(SDB_FILTER_ERR_INVALID_NUM_ARGS);
    
    
        // valid inputs, but too many args
        expect(() => {
            gte(validCol, strVal_1, strVal_1);
        }).toThrowError(SDB_FILTER_ERR_INVALID_NUM_ARGS);
        
        
        // bad column name
        expect(() => {
            gte(invalidCol_space, strVal_1);
        }).toThrowError(SDB_FILTER_ERR_INVALID_COL_NAME);
    
        expect(() => {
            gte(invalidCol_notstring, strVal_1);
       }).toThrowError(SDB_FILTER_ERR_INVALID_COL_NAME);   

        expect(() => {
            gte(invalidCol_firstcharnum, strVal_1);
        }).toThrowError(SDB_FILTER_ERR_INVALID_COL_NAME);  


        // null input values
        expect(() => {
            gte(validCol, null);
        }).toThrowError(SDB_FILTER_ERR_INVALID_TYPE);   
    
        // undefined input values
        expect(() => {
            gte(validCol, undefined);
        }).toThrowError(SDB_FILTER_ERR_INVALID_TYPE); 
    
        // empty string value
        expect(() => {
            gte(validCol, invalidVal_empty);
        }).toThrowError(SDB_FILTER_ERR_EMPTY_STRING);
    
    });

    test('testing: lte()', () => {
    
        let result;
    
        // valid input, strings
        result = lte(validCol, strVal_1);
        expect(result).toBe(`${validCol}/..${strVal_1}`);
    
        // valid input, numbers
        result = lte(validCol, intVal_1);
        expect(result).toBe(`${validCol}/..${intVal_1}`);
    
        // ERROR TESTS
    
        // too few args
        expect(() => {
            lte(validCol);
        }).toThrowError(SDB_FILTER_ERR_INVALID_NUM_ARGS);
    
    
        // valid inputs, but too many args
        expect(() => {
            lte(validCol, strVal_1, strVal_1);
        }).toThrowError(SDB_FILTER_ERR_INVALID_NUM_ARGS);
        
        
        // bad column name
        expect(() => {
            lte(invalidCol_space, strVal_1);
        }).toThrowError(SDB_FILTER_ERR_INVALID_COL_NAME);
    
        expect(() => {
            lte(invalidCol_notstring, strVal_1);
       }).toThrowError(SDB_FILTER_ERR_INVALID_COL_NAME);   

        expect(() => {
            lte(invalidCol_firstcharnum, strVal_1);
        }).toThrowError(SDB_FILTER_ERR_INVALID_COL_NAME);  

        
        // null input values
        expect(() => {
            lte(validCol, null);
        }).toThrowError(SDB_FILTER_ERR_INVALID_TYPE);   
    
        // undefined input values
        expect(() => {
            lte(validCol, undefined);
        }).toThrowError(SDB_FILTER_ERR_INVALID_TYPE); 
    
        // empty string value
        expect(() => {
            lte(validCol, invalidVal_empty);
        }).toThrowError(SDB_FILTER_ERR_EMPTY_STRING);
    
    });    


    test('testing: not()', () => {
    
        let result;
    
        // valid input, strings
        result = not(`${validCol}/${strVal_1}`);
        expect(result).toBe(`~${validCol}/${strVal_1}`);
    
  
        // ERROR TESTS
    
        // too few args
        expect(() => {
            not();
        }).toThrowError(SDB_FILTER_ERR_INVALID_NUM_ARGS);
    
        // non string parameter
        expect(() => {
            not(intVal_1);
        }).toThrowError(SDB_FILTER_ERR_INVALID_TYPE);

        // empty string
        expect(() => {
            not(invalidCol_space);
        }).toThrowError(SDB_FILTER_ERR_NO_COL_FOUND);

        // value that contains no / delimiter (suggests trying to negate a string that doesn't contain a column)
        expect(() => {
            not(strVal_1);
        }).toThrowError(SDB_FILTER_ERR_NO_COL_FOUND);


        
    });

    test('testing: and()', () => {
    
        let result;
    
        // valid input, strings
        result = and(`${validCol}/${strVal_1}`,`LastName/${strVal_2}`);
        expect(result).toBe(`${validCol}/${strVal_1}/LastName/${strVal_2}`);
    
  
        // ERROR TESTS
    
        // too few args
        expect(() => {
            and();
        }).toThrowError(SDB_FILTER_ERR_INVALID_NUM_ARGS);
    
        // non string parameter
        expect(() => {
             and(`${validCol}/${strVal_1}`, intVal_1);
        }).toThrowError(SDB_FILTER_ERR_INVALID_TYPE);

        // empty string
        expect(() => {
            and(`${validCol}/${strVal_1}`, invalidVal_empty);
        }).toThrowError(SDB_FILTER_ERR_INVALID_TYPE);

        // value that contains no / delimiter (suggests trying to negate a string that doesn't contain a column)
        expect(() => {
            and(`${validCol}/${strVal_1}`, `${validCol}${strVal_1}`);
        }).toThrowError(SDB_FILTER_ERR_NO_COL_FOUND);

    });    

    test('testing: multifunction usage', () => {
        
        let result;
        const expected = 'Customer/FirstName/A*/Country/Brazil/City/Brasília,São Paulo/Invoice/InvoiceDate/2011-01-01../Customer/F*..J*/~BillingCountry/Brazil/InvoiceLine/Track';

        result = and(
                    eq('Customer/FirstName','A*'),
                    eq('Country','Brazil'),
                    any('City','Brasília','São Paulo').replaceAll(SDB_SEPARATOR,','),
                    gte('Invoice/InvoiceDate','2011-01-01'),
                    between('Customer','F*','J*'),
                    not(eq('BillingCountry','Brazil')),
                    'InvoiceLine/Track'
                );

        expect(result).toBe(expected);
        
    });
});

describe('DataDiscoveryFilter class tests', () => {

    // column parameter values to test
    const validCol = 'FirstName';
    const invalidCol_space = 'bad columnName';
    const invalidCol_notstring = 1;
    const invalidCol_firstcharnum = '1columnName';

    // value parameter values to test
    const strVal_1 = 'Helena';
    const strVal_2 = 'Bjørn';
    const intVal_1 = 2;
    const intVal_2 = 4;
    const invalidVal_type = [1];
    const invalidVal_empty = ' ';


    const validFilter = "columnName/value";
    const validFilter2 = "columnName2/value2";
    const invalidFilter_notstring = 1;
    const invalidFilter_noslash ="columnNamevalue";
    const validResource = "resource1";
    const validResource2 = "resource2";
    const invalidResource_notstring = 1;
    const invalidResource_slash = "resource1/";
    const invalidResource_spaces = "resource 1";
    const invalidResource_numPrefix = "1resource";
    const validFilterSeparated = any('column','value1','value2','value3');

    test('testing: constructor() - simple instantiation', () => {

        let result;
    
        // simplest case - filter object, no parameters defined
        result = new DataDiscoveryFilter();
        expect(result).toBeInstanceOf(DataDiscoveryFilter);
        expect(result).toHaveProperty('filterString');
        expect(result.filterString).toBe('');
        expect(result).toHaveProperty('resources');
        expect(result.resources.size).toBe(1);
        expect(result.resources).toContain('rootResource');
        expect(result.filters).toHaveProperty('rootResource');
        expect(result.filters.rootResource).toHaveLength(0);
        expect(result).toHaveProperty('pathString');
        expect(result.pathString).toBe('');
        expect(result).toHaveProperty('lastContext');
        expect(result.lastContext).toBe('rootResource');
        expect(result).toHaveProperty('queryParams');
        expect(result.queryParams).toHaveProperty('sort');
        expect(result.queryParams).toHaveProperty('distinct');
        expect(result.queryParams).toHaveProperty('limit');
        expect(result.queryParams).toHaveProperty('offset');
        expect(result.queryParams).toHaveProperty('stream');
        expect(result.queryParams).toHaveProperty('depth');
        expect(result.queryParams).toHaveProperty('transpose');
        expect(result.queryParams).toHaveProperty('wantarray');        
        expect(result.queryParams).toHaveProperty('headers');        
        expect(result.queryParams).toHaveProperty('csvNullStr');        
        expect(result.queryParams).toHaveProperty('href');        
        expect(result.queryParams).toHaveProperty('nil_visible');        
        expect(result.queryParams).toHaveProperty('cardinality');        
        
    });

    test('testing: constructor() - instantiation w/ filter argument', () => {

        let result;
    
        // valid filter
        result = new DataDiscoveryFilter(validFilter);
        expect(result).toBeInstanceOf(DataDiscoveryFilter);
        expect(result).toHaveProperty('filterString');
        expect(result.filterString).toBe(`/${validFilter}`);

        // ERROR TESTS
        
        // bad filter argument
        expect(() => {
            result = new DataDiscoveryFilter('');
        }).toThrowError(SDB_DDF_INVALID_FILTER);

        expect(() => {
            result = new DataDiscoveryFilter(invalidFilter_notstring);
        }).toThrowError(SDB_DDF_INVALID_FILTER);

        expect(() => {
            result = new DataDiscoveryFilter(invalidFilter_noslash);
        }).toThrowError(SDB_DDF_INVALID_FILTER);

    });

    test('testing: constructor() - instantiation w/ custom wildcard/separator', () => {

        let result;
    
        // default wildcard
        result = new DataDiscoveryFilter(validFilter, undefined);
        expect(result).toHaveProperty('wildcard');
        expect(result.wildcard).toBe('*');     

        // default separator
        result = new DataDiscoveryFilter(validFilter, undefined, undefined);
        expect(result).toHaveProperty('separator');
        expect(result.separator).toBe(',');                 

        // valid wildcard set
        result = new DataDiscoveryFilter(validFilter, '@');
        expect(result).toHaveProperty('wildcard');
        expect(result.wildcard).toBe('@');

        // valid separator set
        result = new DataDiscoveryFilter(validFilter, undefined, '@');
        expect(result).toHaveProperty('separator');
        expect(result.separator).toBe('@');        


        // ERROR TESTS

        // invalid wildcard
        expect(() => {
            result = new DataDiscoveryFilter(validFilter, '');
        }).toThrowError(SDB_DDF_INVALID_WILDCARD);

        expect(() => {
            result = new DataDiscoveryFilter(validFilter, '/');
        }).toThrowError(SDB_DDF_INVALID_WILDCARD);

        expect(() => {
            result = new DataDiscoveryFilter(validFilter, 1);
        }).toThrowError(SDB_DDF_INVALID_WILDCARD);

        // invalid separator
        expect(() => {
            result = new DataDiscoveryFilter(validFilter, undefined, '');
        }).toThrowError(SDB_DDF_INVALID_SEPARATOR);

        expect(() => {
            result = new DataDiscoveryFilter(validFilter, undefined, '/');
        }).toThrowError(SDB_DDF_INVALID_SEPARATOR);

        expect(() => {
            result = new DataDiscoveryFilter(validFilter, undefined, 1);
        }).toThrowError(SDB_DDF_INVALID_SEPARATOR);

    });

    test('testing: constructor() - separator string replacement', () => {

        let result;
    
        // check that custom separator is detected properly
        expect(validFilterSeparated).toBe('column/value1|SDBSEP|value2|SDBSEP|value3');
        
        result = new DataDiscoveryFilter(validFilterSeparated, undefined, '@');
        expect(result).toHaveProperty('filterString');
        expect(result.filterString).toBe('/column/value1@value2@value3?&separator=@');

    });        

    test('testing: addFilter() method', () => {

        let result;
    
        // add filter to object without filter
        result = new DataDiscoveryFilter();
        result.addFilter(validFilter2)
        expect(result.filters).toHaveProperty('rootResource')
        expect(result.filters.rootResource).toContain(validFilter2)
        expect(result.filterString).toBe(`/${validFilter2}`);


        // add filter to object with existing filter
        result = new DataDiscoveryFilter(validFilter);
        result.addFilter(validFilter2)
        expect(result.filters).toHaveProperty('rootResource')
        expect(result.filters.rootResource).toContain(validFilter)
        expect(result.filters.rootResource).toContain(validFilter2)
        expect(result.filterString).toBe(`/${validFilter}/${validFilter2}`);

        // check separator replacement works 
        result = new DataDiscoveryFilter(validFilter);
        result.addFilter(validFilterSeparated);
        expect(result.filters).toHaveProperty('rootResource');
        expect(result.filters.rootResource).toContain(validFilter);
        expect(result.filters.rootResource).toContain('column/value1,value2,value3');                
        

        // ERROR TESTS
        
        // bad filter argument
        expect(() => {
            result = new DataDiscoveryFilter();
            result.addFilter('');
        }).toThrowError(SDB_DDF_INVALID_FILTER);

        expect(() => {
            result = new DataDiscoveryFilter();
            result.addFilter(invalidFilter_notstring);
        }).toThrowError(SDB_DDF_INVALID_FILTER);

        expect(() => {
            result = new DataDiscoveryFilter();
            result.addFilter(invalidFilter_noslash);
        }).toThrowError(SDB_DDF_INVALID_FILTER);

    });    

    test('testing: join() method', () => {

        let result;
        result = new DataDiscoveryFilter();
        result.join(validResource);
        expect(result.resources.size).toBe(2);
        expect(result.resources).toContain(validResource);
        expect(result.pathString).toBe(`/${validResource}`);
        result.join(validResource2);
        expect(result.resources).toContain(validResource2);      
        expect(result.pathString).toBe(`/${validResource}/${validResource2}`);

        // ERROR TESTS        
        result = new DataDiscoveryFilter();
        
        expect(() => {
            result = new DataDiscoveryFilter();
            result.join(invalidResource_notstring);
        }).toThrowError(SDB_DDF_INVALID_RESOURCE);

        expect(() => {
            result = new DataDiscoveryFilter();
            result.join(invalidResource_slash);
        }).toThrowError(SDB_DDF_INVALID_RESOURCE);

        expect(() => {
            result = new DataDiscoveryFilter();
            result.join(invalidResource_spaces);
        }).toThrowError(SDB_DDF_INVALID_RESOURCE);

        expect(() => {
            result = new DataDiscoveryFilter();
            result.join(invalidResource_numPrefix);
        }).toThrowError(SDB_DDF_INVALID_RESOURCE);

    });


    test('testing: sort() method', () => {

        let result;
        let validCol1 = "column1";
        let validCol2 = "column2";

        result = new DataDiscoveryFilter(validFilter);
        result.join(validResource);
        result.addFilter(validFilter2);
        
        result.sort(desc(validCol1), asc(validCol2)); // sort by columns
        expect(result.filterString).toBe(`/${validFilter}/${validResource}/${validFilter2}?sort=-${validCol1},${validCol2}`);
        result.sort(false); // reset sort
        expect(result.filterString).toBe(`/${validFilter}/${validResource}/${validFilter2}`);        

        // ERROR CASES

        // no sort columns provided
        expect(() => {
            result = new DataDiscoveryFilter(validFilter);
            result.join(validResource);
            result.addFilter(validFilter2);
            result.sort();
        }).toThrowError(SDB_DDF_INVALID_SORT_COL);

        // space in column name
        expect(() => {
            result = new DataDiscoveryFilter(validFilter);
            result.join(validResource);
            result.addFilter(validFilter2);
            result.sort(validCol1, invalidCol_space);
        }).toThrowError(SDB_DDF_INVALID_SORT_COL);

        // non-string type column
        expect(() => {
            result = new DataDiscoveryFilter(validFilter);
            result.join(validResource);
            result.addFilter(validFilter2);
            result.sort(validCol1, invalidCol_notstring);
        }).toThrowError(SDB_DDF_INVALID_SORT_COL);

        // 1st char in column name is number
        expect(() => {
            result = new DataDiscoveryFilter(validFilter);
            result.join(validResource);
            result.addFilter(validFilter2);
            result.sort(validCol1, invalidCol_firstcharnum);
        }).toThrowError(SDB_DDF_INVALID_SORT_COL);
                
    });

    // internal sort_desc method - not meant for external use
    test('testing: _sort_desc() method', () => {

        let result;
        const sortdesc = DataDiscoveryFilter.prototype._sort_desc;

        result = sortdesc(validCol)
        expect(result).toBe(`-${validCol}`)        

        // ERROR CASES

        expect(() => {
            result = sortdesc(invalidCol_space);
        }).toThrowError(SDB_DDF_INVALID_SORT_COL);

        expect(() => {
            result = sortdesc(invalidCol_notstring);
        }).toThrowError(SDB_DDF_INVALID_SORT_COL);

        expect(() => {
            result = sortdesc(invalidCol_firstcharnum);
        }).toThrowError(SDB_DDF_INVALID_SORT_COL);
               
    });

    // internal _sort_asc method - not meant for external use
    test('testing: _sort_asc() method', () => {

        let result;
        const sortasc = DataDiscoveryFilter.prototype._sort_asc;

        result = sortasc(validCol)
        expect(result).toBe(`${validCol}`)        

        // ERROR CASES

        expect(() => {
            result = sortasc(invalidCol_space);
        }).toThrowError(SDB_DDF_INVALID_SORT_COL);

        expect(() => {
            result = sortasc(invalidCol_notstring);
        }).toThrowError(SDB_DDF_INVALID_SORT_COL);

        expect(() => {
            result = sortasc(invalidCol_firstcharnum);
        }).toThrowError(SDB_DDF_INVALID_SORT_COL);
               
    });

    test('testing: limit() method', () => {

        let result;
        let validValue = 1;
        let invalidValue_str = "1";
        let invalidValue_neg = -1

        result = new DataDiscoveryFilter(validFilter);
        result.join(validResource);
        result.addFilter(validFilter2);
        
        result.limit(validValue); 
        expect(result.filterString).toBe(`/${validFilter}/${validResource}/${validFilter2}?limit=${validValue}`);
        result.limit();
        expect(result.filterString).toBe(`/${validFilter}/${validResource}/${validFilter2}`);        

        // ERROR CASES

        expect(() => {
            result = new DataDiscoveryFilter(validFilter);
            result.join(validResource);
            result.addFilter(validFilter2);
            result.limit(invalidValue_str);
        }).toThrowError(SDB_DDF_LIMIT_TYPE);

        expect(() => {
            result = new DataDiscoveryFilter(validFilter);
            result.join(validResource);
            result.addFilter(validFilter2);
            result.limit(invalidValue_neg);
        }).toThrowError(SDB_DDF_LIMIT_TYPE);

               
    });

    test('testing: offset() method', () => {

        let result;
        let validValue = 1;
        let invalidValue_str = "1";
        let invalidValue_neg = -1

        result = new DataDiscoveryFilter(validFilter);
        result.join(validResource);
        result.addFilter(validFilter2);
        
        result.offset(validValue); 
        expect(result.filterString).toBe(`/${validFilter}/${validResource}/${validFilter2}?offset=${validValue}`);
        result.offset();
        expect(result.filterString).toBe(`/${validFilter}/${validResource}/${validFilter2}`);        

        // ERROR CASES

        expect(() => {
            result = new DataDiscoveryFilter(validFilter);
            result.join(validResource);
            result.addFilter(validFilter2);
            result.offset(invalidValue_str);
        }).toThrowError(SDB_DDF_OFFSET_TYPE);

        expect(() => {
            result = new DataDiscoveryFilter(validFilter);
            result.join(validResource);
            result.addFilter(validFilter2);
            result.offset(invalidValue_neg);
        }).toThrowError(SDB_DDF_OFFSET_TYPE);

               
    });    

    test('testing: depth() method', () => {

        let result;
        let validValue = 1;
        let invalidValue_str = "1";
        let invalidValue_neg = -1

        result = new DataDiscoveryFilter(validFilter);
        result.join(validResource);
        result.addFilter(validFilter2);
        
        result.depth(validValue); 
        expect(result.filterString).toBe(`/${validFilter}/${validResource}/${validFilter2}?depth=${validValue}`);
        result.depth();
        expect(result.filterString).toBe(`/${validFilter}/${validResource}/${validFilter2}`);        

        // ERROR CASES

        expect(() => {
            result = new DataDiscoveryFilter(validFilter);
            result.join(validResource);
            result.addFilter(validFilter2);
            result.depth(invalidValue_str);
        }).toThrowError(SDB_DDF_DEPTH_TYPE);

        expect(() => {
            result = new DataDiscoveryFilter(validFilter);
            result.join(validResource);
            result.addFilter(validFilter2);
            result.depth(invalidValue_neg);
        }).toThrowError(SDB_DDF_DEPTH_TYPE);

    });  

    test('testing: distinct() method', () => {

        let result;
        result = new DataDiscoveryFilter(validFilter);
        result.join(validResource);
        result.addFilter(validFilter2);
        
        // set distinct
        result.distinct();
        expect(result.filterString).toBe(`/${validFilter}/${validResource}/${validFilter2}?distinct=true`);
        
        // remove distinct
        result.distinct(false);
        expect(result.filterString).toBe(`/${validFilter}/${validResource}/${validFilter2}`);
        
        // should be ignored - only true/false allowed
        result.distinct(1);
        expect(result.filterString).toBe(`/${validFilter}/${validResource}/${validFilter2}`);
    });


    test('testing: stream() method', () => {

        let result;
        result = new DataDiscoveryFilter(validFilter);
        result.join(validResource);
        result.addFilter(validFilter2);
        
        // set distinct
        result.stream();
        expect(result.filterString).toBe(`/${validFilter}/${validResource}/${validFilter2}?stream=true`);
        
        // remove distinct
        result.stream(false);
        expect(result.filterString).toBe(`/${validFilter}/${validResource}/${validFilter2}`);
        
        // should be ignored - only true/false allowed
        result.stream(1);
        expect(result.filterString).toBe(`/${validFilter}/${validResource}/${validFilter2}`);
    });

    test('testing: transpose() method', () => {

        let result;
        result = new DataDiscoveryFilter(validFilter);
        result.join(validResource);
        result.addFilter(validFilter2);
        
        // set distinct
        result.transpose();
        expect(result.filterString).toBe(`/${validFilter}/${validResource}/${validFilter2}?transpose=true`);
        
        // remove distinct
        result.transpose(false);
        expect(result.filterString).toBe(`/${validFilter}/${validResource}/${validFilter2}`);
        
        // should be ignored - only true/false allowed
        result.transpose(1);
        expect(result.filterString).toBe(`/${validFilter}/${validResource}/${validFilter2}`);
    });    

    test('testing: wantarray() method', () => {

        let result;
        result = new DataDiscoveryFilter(validFilter);
        result.join(validResource);
        result.addFilter(validFilter2);
        
        // set distinct
        result.wantarray();
        expect(result.filterString).toBe(`/${validFilter}/${validResource}/${validFilter2}?wantarray=true`);
        
        // remove distinct
        result.wantarray(false);
        expect(result.filterString).toBe(`/${validFilter}/${validResource}/${validFilter2}`);
        
        // should be ignored - only true/false allowed
        result.wantarray(1);
        expect(result.filterString).toBe(`/${validFilter}/${validResource}/${validFilter2}`);
    });    

    test('testing: csvHeader() method', () => {

        let result;
        result = new DataDiscoveryFilter(validFilter);
        result.join(validResource);
        result.addFilter(validFilter2);
        
        // set distinct
        result.csvHeader();
        expect(result.filterString).toBe(`/${validFilter}/${validResource}/${validFilter2}?headers=true`);
        
        // remove distinct
        result.csvHeader(false);
        expect(result.filterString).toBe(`/${validFilter}/${validResource}/${validFilter2}`);
        
        // should be ignored - only true/false allowed
        result.csvHeader(1);
        expect(result.filterString).toBe(`/${validFilter}/${validResource}/${validFilter2}`);
    });    

    test('testing: csvNullStr() method', () => {

        let result;
        result = new DataDiscoveryFilter(validFilter);
        result.join(validResource);
        result.addFilter(validFilter2);
        
        // set distinct
        result.csvNullStr();
        expect(result.filterString).toBe(`/${validFilter}/${validResource}/${validFilter2}?csvNullStr=true`);
        
        // remove distinct
        result.csvNullStr(false);
        expect(result.filterString).toBe(`/${validFilter}/${validResource}/${validFilter2}`);
        
        // should be ignored - only true/false allowed
        result.csvNullStr(1);
        expect(result.filterString).toBe(`/${validFilter}/${validResource}/${validFilter2}`);
    });        

    test('testing: jsonHref() method', () => {

        let result;
        result = new DataDiscoveryFilter(validFilter);
        result.join(validResource);
        result.addFilter(validFilter2);
        
        // set distinct
        result.jsonHref();
        expect(result.filterString).toBe(`/${validFilter}/${validResource}/${validFilter2}?href=true`);
        
        // remove distinct
        result.jsonHref(false);
        expect(result.filterString).toBe(`/${validFilter}/${validResource}/${validFilter2}`);
        
        // should be ignored - only true/false allowed
        result.jsonHref(1);
        expect(result.filterString).toBe(`/${validFilter}/${validResource}/${validFilter2}`);
    });       

    test('testing: xmlNilVisible() method', () => {

        let result;
        result = new DataDiscoveryFilter(validFilter);
        result.join(validResource);
        result.addFilter(validFilter2);
        
        // set distinct
        result.xmlNilVisible();
        expect(result.filterString).toBe(`/${validFilter}/${validResource}/${validFilter2}?nil_visible=true`);
        
        // remove distinct
        result.xmlNilVisible(false);
        expect(result.filterString).toBe(`/${validFilter}/${validResource}/${validFilter2}`);
        
        // should be ignored - only true/false allowed
        result.xmlNilVisible(1);
        expect(result.filterString).toBe(`/${validFilter}/${validResource}/${validFilter2}`);
    });   

    test('testing: xsdCardinality() method', () => {

        let result;
        result = new DataDiscoveryFilter(validFilter);
        result.join(validResource);
        result.addFilter(validFilter2);
        
        // set xsdCardinality
        result.xsdCardinality();
        expect(result.filterString).toBe(`/${validFilter}/${validResource}/${validFilter2}?cardinality=unbounded`);

        result.xsdCardinality(1);
        expect(result.filterString).toBe(`/${validFilter}/${validResource}/${validFilter2}?cardinality=1`);

        // remove xsdCardinality
        result.xsdCardinality(false);
        expect(result.filterString).toBe(`/${validFilter}/${validResource}/${validFilter2}`);
        
        // ERROR CASES

        expect(() => {
            result = new DataDiscoveryFilter(validFilter);
            result.join(validResource);
            result.addFilter(validFilter2);
            result.xsdCardinality(-1);
        }).toThrowError(SDB_DDF_XSDCARD_TYPE);

        expect(() => {
            result = new DataDiscoveryFilter(validFilter);
            result.join(validResource);
            result.addFilter(validFilter2);
            result.xsdCardinality(1.1);
        }).toThrowError(SDB_DDF_XSDCARD_TYPE);        

        expect(() => {
            result = new DataDiscoveryFilter(validFilter);
            result.join(validResource);
            result.addFilter(validFilter2);
            result.xsdCardinality('');
        }).toThrowError(SDB_DDF_XSDCARD_TYPE);
        
        expect(() => {
            result = new DataDiscoveryFilter(validFilter);
            result.join(validResource);
            result.addFilter(validFilter2);
            result.xsdCardinality([1]);
        }).toThrowError(SDB_DDF_XSDCARD_TYPE);

    });       
    
    test('testing: DataDiscoveryFilter with composable functions', () => {

        chgSeparator(',');
        let f1 = any("columnA",1,2,3);
        let f2 = eq("columnB","Country");
        let f3 = gte("columnC",10);
        let f4 = and( any("columnD","a","b","c"),eq("columnE",100));

        let result;
        let expected = and(f1,"resource2/",f2,f3,"resource3/",f4).replaceAll('//','/');

        result = new DataDiscoveryFilter(f1);
        result.join("resource2").addFilter(f2).addFilter(f3).join("resource3").addFilter(f4);
        expect(result.filterString).toBe(`/${expected}`);
        chgSeparator();
        
    });
});


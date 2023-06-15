import { DataDiscoveryFilter } from '../src/datadiscoveryfilter.js';
import { eq, any, between, gte, lte, not, and, chgPlaceHolder } from '../src/filterfunctions.js';

import { SDB_DDF_INVALID_RESOURCE, SDB_DDF_INVALID_FILTER,  SDB_DDF_INVALID_WILDCARD, SDB_DDF_INVALID_SEPARATOR,
    SDB_DDF_DEPTH_TYPE, SDB_DDF_XSDCARD_TYPE } from '../src/datadiscoveryfilter.js';

import { desc, asc } from "../src/basefilter.js";
import { SDB_BF_INVALID_SORT_COL, SDB_BF_LIMIT_TYPE, SDB_BF_OFFSET_TYPE, } from "../src/basefilter.js";



beforeAll( () => {

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
        expect(result).toHaveProperty('resources');
        expect(result.resources.size).toBe(1);
        expect(result.resources).toContain('rootResource');
        expect(result.filters).toHaveProperty('rootResource');
        expect(result.filters.rootResource).toHaveLength(0);
        expect(result).toHaveProperty('pathString');
        expect(result.pathString).toBe('');
        expect(result).toHaveProperty('lastContext');
        expect(result.lastContext).toBe('rootResource');
        expect(result).toHaveProperty('wildcard');
        expect(result.wildcard).toBe('*');
        expect(result).toHaveProperty('separator');
        expect(result.separator).toBe(',');
        expect(result).toHaveProperty('urlStringParams');
        expect(result.urlStringParams).toHaveProperty('stream');
        expect(result.urlStringParams).toHaveProperty('depth');
        expect(result.urlStringParams).toHaveProperty('headers');        
        expect(result.urlStringParams).toHaveProperty('csvNullStr');        
        expect(result.urlStringParams).toHaveProperty('href');        
        expect(result.urlStringParams).toHaveProperty('cardinality');        
        
    });

    test('testing: constructor() - instantiation w/ filter argument', () => {

        let result;
    
        // valid filter
        result = new DataDiscoveryFilter(validFilter);
        expect(result).toBeInstanceOf(DataDiscoveryFilter);
        expect(result).toHaveProperty('endpoint');
        expect(result.endpoint).toBe(`/${validFilter}`);

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
        expect(result).toHaveProperty('endpoint');
        expect(result.endpoint).toBe('/column/value1@value2@value3?&separator=@');

    });        

    test('testing: addFilter() method', () => {

        let result;
    
        // add filter to object without filter
        result = new DataDiscoveryFilter();
        result.addFilter(validFilter2)
        expect(result.filters).toHaveProperty('rootResource')
        expect(result.filters.rootResource).toContain(validFilter2)
        expect(result.endpoint).toBe(`/${validFilter2}`);


        // add filter to object with existing filter
        result = new DataDiscoveryFilter(validFilter);
        result.addFilter(validFilter2)
        expect(result.filters).toHaveProperty('rootResource')
        expect(result.filters.rootResource).toContain(validFilter)
        expect(result.filters.rootResource).toContain(validFilter2)
        expect(result.endpoint).toBe(`/${validFilter}/${validFilter2}`);

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
        expect(result.endpoint).toBe(`/${validFilter}/${validResource}/${validFilter2}?sort=-${validCol1},${validCol2}`);
        result.sort(false); // reset sort
        expect(result.endpoint).toBe(`/${validFilter}/${validResource}/${validFilter2}`);        

        // ERROR CASES

        // no sort columns provided
        expect(() => {
            result = new DataDiscoveryFilter(validFilter);
            result.join(validResource);
            result.addFilter(validFilter2);
            result.sort();
        }).toThrowError(SDB_BF_INVALID_SORT_COL);

        // space in column name
        expect(() => {
            result = new DataDiscoveryFilter(validFilter);
            result.join(validResource);
            result.addFilter(validFilter2);
            result.sort(validCol1, invalidCol_space);
        }).toThrowError(SDB_BF_INVALID_SORT_COL);

        // non-string type column
        expect(() => {
            result = new DataDiscoveryFilter(validFilter);
            result.join(validResource);
            result.addFilter(validFilter2);
            result.sort(validCol1, invalidCol_notstring);
        }).toThrowError(SDB_BF_INVALID_SORT_COL);

        // 1st char in column name is number
        expect(() => {
            result = new DataDiscoveryFilter(validFilter);
            result.join(validResource);
            result.addFilter(validFilter2);
            result.sort(validCol1, invalidCol_firstcharnum);
        }).toThrowError(SDB_BF_INVALID_SORT_COL);
                
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
        }).toThrowError(SDB_BF_INVALID_SORT_COL);

        expect(() => {
            result = sortdesc(invalidCol_notstring);
        }).toThrowError(SDB_BF_INVALID_SORT_COL);

        expect(() => {
            result = sortdesc(invalidCol_firstcharnum);
        }).toThrowError(SDB_BF_INVALID_SORT_COL);
               
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
        }).toThrowError(SDB_BF_INVALID_SORT_COL);

        expect(() => {
            result = sortasc(invalidCol_notstring);
        }).toThrowError(SDB_BF_INVALID_SORT_COL);

        expect(() => {
            result = sortasc(invalidCol_firstcharnum);
        }).toThrowError(SDB_BF_INVALID_SORT_COL);
               
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
        expect(result.endpoint).toBe(`/${validFilter}/${validResource}/${validFilter2}?limit=${validValue}`);
        result.limit();
        expect(result.endpoint).toBe(`/${validFilter}/${validResource}/${validFilter2}`);        

        // ERROR CASES

        expect(() => {
            result = new DataDiscoveryFilter(validFilter);
            result.join(validResource);
            result.addFilter(validFilter2);
            result.limit(invalidValue_str);
        }).toThrowError(SDB_BF_LIMIT_TYPE);

        expect(() => {
            result = new DataDiscoveryFilter(validFilter);
            result.join(validResource);
            result.addFilter(validFilter2);
            result.limit(invalidValue_neg);
        }).toThrowError(SDB_BF_LIMIT_TYPE);

               
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
        expect(result.endpoint).toBe(`/${validFilter}/${validResource}/${validFilter2}?offset=${validValue}`);
        result.offset();
        expect(result.endpoint).toBe(`/${validFilter}/${validResource}/${validFilter2}`);        

        // ERROR CASES

        expect(() => {
            result = new DataDiscoveryFilter(validFilter);
            result.join(validResource);
            result.addFilter(validFilter2);
            result.offset(invalidValue_str);
        }).toThrowError(SDB_BF_OFFSET_TYPE);

        expect(() => {
            result = new DataDiscoveryFilter(validFilter);
            result.join(validResource);
            result.addFilter(validFilter2);
            result.offset(invalidValue_neg);
        }).toThrowError(SDB_BF_OFFSET_TYPE);

               
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
        expect(result.endpoint).toBe(`/${validFilter}/${validResource}/${validFilter2}?depth=${validValue}`);
        result.depth();
        expect(result.endpoint).toBe(`/${validFilter}/${validResource}/${validFilter2}`);        

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
        expect(result.endpoint).toBe(`/${validFilter}/${validResource}/${validFilter2}?distinct=true`);
        
        // remove distinct
        result.distinct(false);
        expect(result.endpoint).toBe(`/${validFilter}/${validResource}/${validFilter2}`);
        
        // should be ignored - only true/false allowed
        result.distinct(1);
        expect(result.endpoint).toBe(`/${validFilter}/${validResource}/${validFilter2}`);
    });


    test('testing: stream() method', () => {

        let result;
        result = new DataDiscoveryFilter(validFilter);
        result.join(validResource);
        result.addFilter(validFilter2);
        
        // set stream
        result.stream();
        expect(result.endpoint).toBe(`/${validFilter}/${validResource}/${validFilter2}?stream=true`);
        
        // remove stream
        result.stream(false);
        expect(result.endpoint).toBe(`/${validFilter}/${validResource}/${validFilter2}`);
        
        // should be ignored - only true/false allowed
        result.stream(1);
        expect(result.endpoint).toBe(`/${validFilter}/${validResource}/${validFilter2}`);
    });

    test('testing: transpose() method', () => {

        let result;
        result = new DataDiscoveryFilter(validFilter);
        result.join(validResource);
        result.addFilter(validFilter2);
        
        // set transpose
        result.transpose();
        expect(result.endpoint).toBe(`/${validFilter}/${validResource}/${validFilter2}?transpose=true`);
        
        // remove transpose
        result.transpose(false);
        expect(result.endpoint).toBe(`/${validFilter}/${validResource}/${validFilter2}`);
        
        // should be ignored - only true/false allowed
        result.transpose(1);
        expect(result.endpoint).toBe(`/${validFilter}/${validResource}/${validFilter2}`);
    });    

    test('testing: wantarray() method', () => {

        let result;
        result = new DataDiscoveryFilter(validFilter);
        result.join(validResource);
        result.addFilter(validFilter2);
        
        // set wantarray
        result.wantarray();
        expect(result.endpoint).toBe(`/${validFilter}/${validResource}/${validFilter2}?wantarray=true`);
        
        // remove wantarray
        result.wantarray(false);
        expect(result.endpoint).toBe(`/${validFilter}/${validResource}/${validFilter2}`);
        
        // should be ignored - only true/false allowed
        result.wantarray(1);
        expect(result.endpoint).toBe(`/${validFilter}/${validResource}/${validFilter2}`);
    });    

    test('testing: csvHeader() method', () => {

        let result;
        result = new DataDiscoveryFilter(validFilter);
        result.join(validResource);
        result.addFilter(validFilter2);
        
        // set csvHeader
        result.csvHeader();
        expect(result.endpoint).toBe(`/${validFilter}/${validResource}/${validFilter2}`);
        
        // remove csvHeader
        result.csvHeader(false);
        expect(result.endpoint).toBe(`/${validFilter}/${validResource}/${validFilter2}?headers=false`);
        
        // should be ignored, keeping the value last set - only true/false allowed
        result.csvHeader(1);
        expect(result.endpoint).toBe(`/${validFilter}/${validResource}/${validFilter2}?headers=false`);
    });    

    test('testing: csvNullStr() method', () => {

        let result;
        result = new DataDiscoveryFilter(validFilter);
        result.join(validResource);
        result.addFilter(validFilter2);
        
        // set csvNullStr
        result.csvNullStr();
        expect(result.endpoint).toBe(`/${validFilter}/${validResource}/${validFilter2}?csvNullStr=true`);
        
        // remove csvNullStr
        result.csvNullStr(false);
        expect(result.endpoint).toBe(`/${validFilter}/${validResource}/${validFilter2}`);
        
        // should be ignored - only true/false allowed
        result.csvNullStr(1);
        expect(result.endpoint).toBe(`/${validFilter}/${validResource}/${validFilter2}`);
    });        

    test('testing: jsonHref() method', () => {

        let result;
        result = new DataDiscoveryFilter(validFilter);
        result.join(validResource);
        result.addFilter(validFilter2);
        
        // set jsonHref
        result.jsonHref();
        expect(result.endpoint).toBe(`/${validFilter}/${validResource}/${validFilter2}`);
        
        // remove jsonHref
        result.jsonHref(false);
        expect(result.endpoint).toBe(`/${validFilter}/${validResource}/${validFilter2}?href=false`);

        // should be ignored, keeping the value last set - only true/false allowed - only true/false allowed
        result.jsonHref(1);
        expect(result.endpoint).toBe(`/${validFilter}/${validResource}/${validFilter2}?href=false`);
    });       

    test('testing: xmlNilVisible() method', () => {

        let result;
        result = new DataDiscoveryFilter(validFilter);
        result.join(validResource);
        result.addFilter(validFilter2);
        
        // set xmlNilVisible
        result.xmlNilVisible();
        expect(result.endpoint).toBe(`/${validFilter}/${validResource}/${validFilter2}?nil_visible=true`);
        
        // remove xmlNilVisible
        result.xmlNilVisible(false);
        expect(result.endpoint).toBe(`/${validFilter}/${validResource}/${validFilter2}`);
        
        // should be ignored - only true/false allowed
        result.xmlNilVisible(1);
        expect(result.endpoint).toBe(`/${validFilter}/${validResource}/${validFilter2}`);
    });   

    test('testing: xsdCardinality() method', () => {

        let result;
        result = new DataDiscoveryFilter(validFilter);
        result.join(validResource);
        result.addFilter(validFilter2);
        
        // set xsdCardinality
        result.xsdCardinality();
        expect(result.endpoint).toBe(`/${validFilter}/${validResource}/${validFilter2}?cardinality=unbounded`);

        result.xsdCardinality(1);
        expect(result.endpoint).toBe(`/${validFilter}/${validResource}/${validFilter2}?cardinality=1`);

        // remove xsdCardinality
        result.xsdCardinality(false);
        expect(result.endpoint).toBe(`/${validFilter}/${validResource}/${validFilter2}`);
        
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

        chgPlaceHolder(',');
        let f1 = any("columnA",1,2,3);
        let f2 = eq("columnB","Country");
        let f3 = not(gte("columnC",10));
        let f4 = and( any("columnD","a","b","c"),eq("columnE",100));
        let cols = "/col1,col2,col3"

        let result;
        let expected = and(f1,"resource2/",f2,f3,"resource3/",f4).replaceAll('//','/') + cols;

        result = new DataDiscoveryFilter(f1);
        result.join("resource2").addFilter(f2).addFilter(f3).join("resource3").addFilter(f4).cols('col1','col2','col3');
        expect(result.endpoint).toBe(`/${expected}`);
        chgPlaceHolder();
        
    });
});


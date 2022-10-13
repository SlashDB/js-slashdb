import { SQLPassThruFilter } from '../modules/sqlpassthrufilter.js';

import { SDB_SPTF_INVALID_PARAM_FORMAT, SDB_SPTF_INVALID_PARAM_NAME, SDB_SPTF_INVALID_PARAM_VALUE, SDB_SPTF_INVALID_XMLTYPE } from '../modules/sqlpassthrufilter.js'

import { desc, asc } from "../modules/basefilter.js";
import { SDB_BF_INVALID_SORT_COL, SDB_BF_LIMIT_TYPE, SDB_BF_OFFSET_TYPE, } from "../modules/basefilter.js";



beforeAll( () => {

});

describe('SQLPassThruFilter class tests', () => {

    // column parameter values to test
    const validParam = 'FirstName';
    const validParam2 = 'LastName';
    const invalidParam_space = 'bad param';
    const invalidParam_slash = 'bad/param';    
    const invalidParam_notstring = 1;
    const invalidParam_firstcharnum = '1columnName';
    

    // value parameter values to test
    const strVal_1 = 'Helena';
    const strVal_2 = 'Bjørn';
    const intVal_1 = 2;
    const intVal_2 = 4;
    const invalidVal_type = [1];
    const invalidVal_empty = ' ';
    const invalidVal_slash = 'bad/value';

    test('testing: constructor() - simple instantiation', () => {

        let result;
    
        // simplest case - filter object, no parameters defined
        result = new SQLPassThruFilter();
        expect(result).toBeInstanceOf(SQLPassThruFilter);
        expect(result).toHaveProperty('queryParams');
        expect(result.queryParams).toStrictEqual({});
        expect(result).toHaveProperty('pathString');
        expect(result.pathString).toBe('');
        expect(result).toHaveProperty('endpoint');
        expect(result.endpoint).toBe('/');
        expect(result).toHaveProperty('urlStringParams');
        expect(result.urlStringParams).toHaveProperty('count');
        expect(result.urlStringParams).toHaveProperty('xmlType');

    });
    

    test('testing: constructor() - instantiation w/ params object', () => {

        let result;
    
        // valid filter
        result = new SQLPassThruFilter({[validParam]:strVal_1});
        expect(result).toBeInstanceOf(SQLPassThruFilter);
        expect(result).toHaveProperty('queryParams');
        expect(result.queryParams[validParam]).toBe(strVal_1);
        expect(result).toHaveProperty('pathString');
        expect(result.pathString).toBe(`/${validParam}/${strVal_1}`);        
        expect(result).toHaveProperty('endpoint');
        expect(result.endpoint).toBe(`/${validParam}/${strVal_1}`);

        result = new SQLPassThruFilter({[validParam]:intVal_1});
        expect(result).toBeInstanceOf(SQLPassThruFilter);
        expect(result).toHaveProperty('queryParams');
        expect(result.queryParams[validParam]).toBe(intVal_1);
        expect(result).toHaveProperty('pathString');
        expect(result.pathString).toBe(`/${validParam}/${intVal_1}`);           
        expect(result).toHaveProperty('endpoint');        
        expect(result.endpoint).toBe(`/${validParam}/${intVal_1}`);     

        // null filter
        result = new SQLPassThruFilter(null);
        expect(result).toBeInstanceOf(SQLPassThruFilter);
        expect(result).toHaveProperty('queryParams');
        expect(result.queryParams).toStrictEqual({});
        expect(result).toHaveProperty('endpoint');
        expect(result.endpoint).toBe('/');

        // ERROR TESTS
        
        // bad filter argument

        // not passing a key/value pair object
        expect(() => {
            result = new SQLPassThruFilter(`'${validParam}','${strVal_1}'`);
        }).toThrowError(SDB_SPTF_INVALID_PARAM_FORMAT);

        expect(() => {
            result = new SQLPassThruFilter({[invalidParam_notstring]:strVal_1});
        }).toThrowError(SDB_SPTF_INVALID_PARAM_NAME);

        expect(() => {
            result = new SQLPassThruFilter({[invalidParam_space]:strVal_1});
        }).toThrowError(SDB_SPTF_INVALID_PARAM_NAME);        

        expect(() => {
            result = new SQLPassThruFilter({[invalidParam_firstcharnum]:strVal_1});
        }).toThrowError(SDB_SPTF_INVALID_PARAM_NAME);

        expect(() => {
            result = new SQLPassThruFilter({'query/string':strVal_1});
        }).toThrowError(SDB_SPTF_INVALID_PARAM_NAME);        

        expect(() => {
            result = new SQLPassThruFilter({[validParam]:invalidVal_type});
        }).toThrowError(SDB_SPTF_INVALID_PARAM_VALUE);

        expect(() => {
            result = new SQLPassThruFilter({[validParam]:invalidVal_slash});
        }).toThrowError(SDB_SPTF_INVALID_PARAM_VALUE);

    });


    test('testing: addParams()', () => {

        let result;
    
        result = new SQLPassThruFilter();
        result.addParams({[validParam]:strVal_1, [validParam2]:intVal_1})
        expect(result.queryParams).toHaveProperty(validParam);
        expect(result.queryParams).toHaveProperty(validParam2);
        expect(result.queryParams[validParam]).toBe(strVal_1);
        expect(result.queryParams[validParam2]).toBe(intVal_1);
        expect(result).toHaveProperty('pathString');
        expect(result.pathString).toBe(`/${validParam}/${strVal_1}/${validParam2}/${intVal_1}`);           
        expect(result).toHaveProperty('endpoint');        
        expect(result.endpoint).toBe(`/${validParam}/${strVal_1}/${validParam2}/${intVal_1}`);           


        // ERROR TESTS
        // bad filter argument
        // not passing a key/value pair object
        expect(() => {
            result.addParams(`'${validParam}','${strVal_1}'`);
        }).toThrowError(SDB_SPTF_INVALID_PARAM_FORMAT);

        expect(() => {
            result.addParams({[invalidParam_notstring]:strVal_1});
        }).toThrowError(SDB_SPTF_INVALID_PARAM_NAME);

        expect(() => {
            result.addParams({[invalidParam_space]:strVal_1});
        }).toThrowError(SDB_SPTF_INVALID_PARAM_NAME);        

        expect(() => {
            result.addParams({[invalidParam_firstcharnum]:strVal_1});
        }).toThrowError(SDB_SPTF_INVALID_PARAM_NAME);

        expect(() => {
            result.addParams({'query/string':strVal_1});
        }).toThrowError(SDB_SPTF_INVALID_PARAM_NAME);        

        expect(() => {
            result.addParams({[validParam]:invalidVal_type});
        }).toThrowError(SDB_SPTF_INVALID_PARAM_VALUE);

        expect(() => {
            result.addParams({[validParam]:invalidVal_slash});
        }).toThrowError(SDB_SPTF_INVALID_PARAM_VALUE);

    });


    test('testing: sort() method', () => {

        let result;
        let validCol1 = "column1";
        let validCol2 = "column2";

        let invalidCol_space = 'invalid col';
        let invalidCol_notstring = 1;
        let invalidCol_firstcharnum = '1invalid';

        result = new SQLPassThruFilter();
        result.addParams({[validParam]:strVal_1});
        
        result.sort(desc(validCol1), asc(validCol2)); // sort by columns
        expect(result.endpoint).toBe(`/${validParam}/${strVal_1}?sort=-${validCol1},${validCol2}`);
        result.sort(false); // reset sort
        expect(result.endpoint).toBe(`/${validParam}/${strVal_1}`);        

        // ERROR CASES

        // no sort columns provided
        expect(() => {
            result = new SQLPassThruFilter();
            result.addParams({[validParam]:strVal_1});
            result.sort();
        }).toThrowError(SDB_BF_INVALID_SORT_COL);

        // space in column name
        expect(() => {
            result = new SQLPassThruFilter();
            result.addParams({[validParam]:strVal_1});
            result.sort(validCol1, invalidCol_space);
        }).toThrowError(SDB_BF_INVALID_SORT_COL);

        // non-string type column
        expect(() => {
            result = new SQLPassThruFilter();
            result.addParams({[validParam]:strVal_1});
            result.sort(validCol1, invalidCol_notstring);
        }).toThrowError(SDB_BF_INVALID_SORT_COL);

        // 1st char in column name is number
        expect(() => {
            result = new SQLPassThruFilter();
            result.addParams({[validParam]:strVal_1});
            result.sort(validCol1, invalidCol_firstcharnum);
        }).toThrowError(SDB_BF_INVALID_SORT_COL);
                
    });


    test('testing: limit() method', () => {

        let result;
        let validValue = 1;
        let invalidValue_str = "1";
        let invalidValue_neg = -1

        result = new SQLPassThruFilter();
        result.addParams({[validParam]:strVal_1});
        
        result.limit(validValue); 
        expect(result.endpoint).toBe(`/${validParam}/${strVal_1}?limit=${validValue}`);
        result.limit();
        expect(result.endpoint).toBe(`/${validParam}/${strVal_1}`);  

        // ERROR CASES

        expect(() => {
            result = new SQLPassThruFilter();
            result.addParams({[validParam]:strVal_1});
            result.limit(invalidValue_str);
        }).toThrowError(SDB_BF_LIMIT_TYPE);

        expect(() => {
            result = new SQLPassThruFilter();
            result.addParams({[validParam]:strVal_1});
            result.limit(invalidValue_neg);
        }).toThrowError(SDB_BF_LIMIT_TYPE);

               
    });


    test('testing: offset() method', () => {

        let result;
        let validValue = 1;
        let invalidValue_str = "1";
        let invalidValue_neg = -1

        result = new SQLPassThruFilter();
        result.addParams({[validParam]:strVal_1});
        
        result.offset(validValue); 
        expect(result.endpoint).toBe(`/${validParam}/${strVal_1}?offset=${validValue}`);
        result.offset();
        expect(result.endpoint).toBe(`/${validParam}/${strVal_1}`);  

        // ERROR CASES

        expect(() => {
            result = new SQLPassThruFilter();
            result.addParams({[validParam]:strVal_1});
            result.offset(invalidValue_str);
        }).toThrowError(SDB_BF_OFFSET_TYPE);

        expect(() => {
            result = new SQLPassThruFilter();
            result.addParams({[validParam]:strVal_1});
            result.offset(invalidValue_neg);
        }).toThrowError(SDB_BF_OFFSET_TYPE);

               
    });    


    test('testing: distinct() method', () => {

        let result;
        result = new SQLPassThruFilter();
        result.addParams({[validParam]:strVal_1});
        
        // set distinct
        result.distinct();
        expect(result.endpoint).toBe(`/${validParam}/${strVal_1}?distinct=true`);
        
        // remove distinct
        result.distinct(false);
        expect(result.endpoint).toBe(`/${validParam}/${strVal_1}`);
        
        // should be ignored - only true/false allowed
        result.distinct(1);
        expect(result.endpoint).toBe(`/${validParam}/${strVal_1}`);
    });


    test('testing: transpose() method', () => {

        let result;
        result = new SQLPassThruFilter();
        result.addParams({[validParam]:strVal_1});
        
        // set transpose
        result.transpose();
        expect(result.endpoint).toBe(`/${validParam}/${strVal_1}?transpose=true`);
        
        // remove transpose
        result.transpose(false);
        expect(result.endpoint).toBe(`/${validParam}/${strVal_1}`);
        
        // should be ignored - only true/false allowed
        result.transpose(1);
        expect(result.endpoint).toBe(`/${validParam}/${strVal_1}`);
    }); 


    test('testing: xmlNilVisible() method', () => {

        let result;
        result = new SQLPassThruFilter();
        result.addParams({[validParam]:strVal_1});
        
        // set xmlNilVisible
        result.xmlNilVisible();
        expect(result.endpoint).toBe(`/${validParam}/${strVal_1}?nil_visible=true`);
        
        // remove xmlNilVisible
        result.xmlNilVisible(false);
        expect(result.endpoint).toBe(`/${validParam}/${strVal_1}`);
        
        // should be ignored - only true/false allowed
        result.xmlNilVisible(1);
        expect(result.endpoint).toBe(`/${validParam}/${strVal_1}`);
    }); 


    test('testing: count() method', () => {

        let result;
        result = new SQLPassThruFilter();
        result.addParams({[validParam]:strVal_1});
        
        // set count
        result.count();
        expect(result.endpoint).toBe(`/${validParam}/${strVal_1}?count=true`);
        
        // remove count
        result.count(false);
        expect(result.endpoint).toBe(`/${validParam}/${strVal_1}`);
        
        // should be ignored - only true/false allowed
        result.count(1);
        expect(result.endpoint).toBe(`/${validParam}/${strVal_1}`);
    });


    test('testing: xmlType() method', () => {

        let result;
        result = new SQLPassThruFilter();
        result.addParams({[validParam]:strVal_1});
        
        // set xmlType
        result.xmlType('adPersistXML');
        expect(result.endpoint).toBe(`/${validParam}/${strVal_1}?xmlType=adPersistXML`);
        
        // remove xmlType
        result.xmlType();
        expect(result.endpoint).toBe(`/${validParam}/${strVal_1}`);
        
        // should be ignored - only true/false allowed
        expect(() => {
            result = new SQLPassThruFilter();
            result.addParams({[validParam]:strVal_1});
            result.xmlType([1]);
        }).toThrowError(SDB_SPTF_INVALID_XMLTYPE);
    });    
});


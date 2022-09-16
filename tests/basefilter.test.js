import { BaseFilter, desc, asc } from "../modules/basefilter.js";
import { SDB_BF_INVALID_SORT_COL, SDB_BF_LIMIT_TYPE, SDB_BF_OFFSET_TYPE, } from "../modules/basefilter.js";

beforeAll( () => {

});

describe('BaseFilter class tests', () => {

    // column parameter values to test
    const validCol = 'FirstName';
    const invalidCol_space = 'bad columnName';
    const invalidCol_notstring = 1;
    const invalidCol_firstcharnum = '1columnName';


    test('testing: constructor() - simple instantiation', () => {

        let result;
    
        // simplest case - filter object, no parameters defined
        result = new BaseFilter();
        expect(result).toBeInstanceOf(BaseFilter);
        expect(result).toHaveProperty('endpoint');
        expect(result.endpoint).toBe(null);
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

    test('testing: sort() method', () => {

        let result;
        let validCol1 = "column1";
        let validCol2 = "column2";

        result = new BaseFilter();
        
        result.sort(desc(validCol1), asc(validCol2)); // sort by columns
        expect(result.queryParams['sort']).toBe(`-${validCol1},${validCol2}`);
        result.sort(false); // reset sort
        expect(result.queryParams['sort']).toBe(undefined);        

        // ERROR CASES

        // no sort columns provided
        expect(() => {
            result = new BaseFilter();
            result.sort();
        }).toThrowError(SDB_BF_INVALID_SORT_COL);

        // space in column name
        expect(() => {
            result = new BaseFilter();
            result.sort(validCol1, invalidCol_space);
        }).toThrowError(SDB_BF_INVALID_SORT_COL);

        // non-string type column
        expect(() => {
            result = new BaseFilter();
            result.sort(validCol1, invalidCol_notstring);
        }).toThrowError(SDB_BF_INVALID_SORT_COL);

        // 1st char in column name is number
        expect(() => {
            result = new BaseFilter();
            result.sort(validCol1, invalidCol_firstcharnum);
        }).toThrowError(SDB_BF_INVALID_SORT_COL);
                
    });

    // internal sort_desc method - not meant for external use
    test('testing: _sort_desc() method', () => {

        let result;
        const sortdesc = BaseFilter.prototype._sort_desc;

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
        const sortasc = BaseFilter.prototype._sort_asc;

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

        result = new BaseFilter();
        result.limit(validValue); 
        expect(result.queryParams['limit']).toBe(validValue);
        result.limit();
        expect(result.queryParams['limit']).toBe(undefined);        

        // ERROR CASES

        expect(() => {
            result = new BaseFilter();
            result.limit(invalidValue_str);
        }).toThrowError(SDB_BF_LIMIT_TYPE);

        expect(() => {
            result = new BaseFilter();
            result.limit(invalidValue_neg);
        }).toThrowError(SDB_BF_LIMIT_TYPE);

               
    });

    test('testing: offset() method', () => {

        let result;
        let validValue = 1;
        let invalidValue_str = "1";
        let invalidValue_neg = -1

        result = new BaseFilter();
        result.offset(validValue); 
        expect(result.queryParams['offset']).toBe(validValue);
        result.offset();
        expect(result.queryParams['offset']).toBe(undefined);        

        // ERROR CASES

        expect(() => {
            result = new BaseFilter();
            result.offset(invalidValue_str);
        }).toThrowError(SDB_BF_OFFSET_TYPE);

        expect(() => {
            result = new BaseFilter();
            result.offset(invalidValue_neg);
        }).toThrowError(SDB_BF_OFFSET_TYPE);

               
    });    

    
    test('testing: distinct() method', () => {

        let result;
        result = new BaseFilter();
        
        // set distinct
        result.distinct();
        expect(result.queryParams['distinct']).toBe(true);
        
        // remove distinct
        result.distinct(false);
        expect(result.queryParams['distinct']).toBe(false);
        
        // should be ignored - only true/false allowed
        result.distinct(1);
        expect(result.queryParams['distinct']).toBe(false);
    });


    test('testing: transpose() method', () => {

        let result;
        result = new BaseFilter();
        
        // set transpose
        result.transpose();
        expect(result.queryParams['transpose']).toBe(true);
        
        // remove transpose
        result.transpose(false);
        expect(result.queryParams['transpose']).toBe(false);
        
        // should be ignored - only true/false allowed
        result.transpose(1);
        expect(result.queryParams['transpose']).toBe(false);
    });    


    test('testing: xmlNilVisible() method', () => {

        let result;
        result = new BaseFilter();
        
        // set xmlNil
        result.xmlNilVisible();
        expect(result.queryParams['nil_visible']).toBe(true);
        
        // remove xmlNil
        result.xmlNilVisible(false);
        expect(result.queryParams['nil_visible']).toBe(false);
        
        // should be ignored - only true/false allowed
        result.xmlNilVisible(1);
        expect(result.queryParams['nil_visible']).toBe(false);
    });   


});


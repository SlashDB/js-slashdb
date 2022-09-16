import { eq, any, between, gte, lte, not, and, chgSeparator } from '../modules/filterfunctions.js';
import { SDB_FILTER_ERR_INVALID_COL_NAME, SDB_FILTER_ERR_INVALID_NUM_ARGS, SDB_FILTER_ERR_INVALID_TYPE, SDB_FILTER_ERR_EMPTY_STRING, 
    SDB_FILTER_ERR_INVALID_COMPARE_TYPE, SDB_FILTER_ERR_INVALID_RANGE, SDB_FILTER_ERR_NO_COL_FOUND, SDB_SEPARATOR } from '../modules/filterfunctions.js'    


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
import { eq, any, between, gte, lte, not, and, chgPlaceHolder, SDB_FILTER_ERR_INVALID_TYPE_NULL } from '../src/filterfunctions.js';
import { SDB_FILTER_ERR_INVALID_COL_NAME, SDB_FILTER_ERR_INVALID_NUM_ARGS, SDB_FILTER_ERR_INVALID_TYPE, 
    SDB_FILTER_ERR_INVALID_VALUE_EMPTY_STRING, SDB_FILTER_ERR_INVALID_VALUE_SLASH, SDB_FILTER_ERR_INVALID_COMPARE_TYPE, 
    SDB_FILTER_ERR_INVALID_RANGE, SDB_FILTER_ERR_NO_COL_FOUND, SDB_FILTER_ERR_INVALID_RANGE_VALUE_DOTS, 
    SDB_FILTER_ERR_INVALID_ARRAY_ARG, SDB_SEPARATOR, SDB_NULLSTR
} from '../src/filterfunctions.js'    


beforeAll( () => {

});

describe('Composable functions unit tests', () => {
    
    // column parameter values to test
    const validCol = 'FirstName';
    const invalidCol_space = 'bad columnName';
    const invalidCol_notstring = 1;
    const invalidCol_firstcharnum = '1columnName';
    const invalidCol_emptyStr = '';
    const invalidCol_slash = 'column/slash';

    // value parameter values to test
    const strVal_1 = 'Helena';
    const strVal_2 = 'Bjørn';
    const intVal_1 = 2;
    const intVal_2 = 4;
    const invalidVal_type = [1];
    const invalidVal_empty = ' ';
    const invalidVal_slash = 'value/slash';
    const invalidVal_dots = 'value..value';
    
    test('testing: eq()', () => {
   
        let result;
    
        // valid inputs, string, number, null
        result = eq(validCol, strVal_1);
        expect(result).toBe(`${validCol}/${strVal_1}`);
        result = eq(validCol, intVal_1);
        expect(result).toBe(`${validCol}/${intVal_1}`);
        result = eq(validCol, null);
        expect(result).toBe(`${validCol}/${SDB_NULLSTR}`);


    
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

        expect(() => {
            eq(invalidCol_emptyStr, strVal_1);
        }).toThrowError(SDB_FILTER_ERR_INVALID_COL_NAME); 

        expect(() => {
            eq(invalidCol_slash, strVal_1);
        }).toThrowError(SDB_FILTER_ERR_INVALID_COL_NAME);         

        // non string/number values in parameters
        expect(() => {
            eq(validCol, invalidVal_type);
        }).toThrowError(SDB_FILTER_ERR_INVALID_TYPE_NULL);
    
        expect(() => {
            eq(validCol, undefined);
        }).toThrowError(SDB_FILTER_ERR_INVALID_TYPE_NULL);   
        
        expect(() => {
            eq(validCol, invalidVal_slash);
        }).toThrowError(SDB_FILTER_ERR_INVALID_VALUE_SLASH);         
    
    });
    
    
    test('testing: any()', () => {
    
        let result;
        
        // valid inputs, strings/numbers/null can be mixed
        result = any(validCol, strVal_1, null, intVal_1, strVal_2);
        expect(result).toBe(`${validCol}/${strVal_1}${SDB_SEPARATOR}${SDB_NULLSTR}${SDB_SEPARATOR}${intVal_1}${SDB_SEPARATOR}${strVal_2}`)
    
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

        expect(() => {
            any(invalidCol_emptyStr, strVal_1, intVal_1, strVal_2);            
        }).toThrowError(SDB_FILTER_ERR_INVALID_COL_NAME);   
        
        expect(() => {
            any(invalidCol_slash, strVal_1, strVal_2);
        }).toThrowError(SDB_FILTER_ERR_INVALID_COL_NAME);         

        // non string/number values in parameters
        expect(() => {
             any(validCol, strVal_1, invalidVal_type, intVal_1, strVal_2);
        }).toThrowError(SDB_FILTER_ERR_INVALID_TYPE_NULL);
    
        expect(() => {
            any(validCol, strVal_1, undefined);
        }).toThrowError(SDB_FILTER_ERR_INVALID_TYPE_NULL);   
        
        expect(() => {
            any(validCol, invalidVal_slash, strVal_2);
        }).toThrowError(SDB_FILTER_ERR_INVALID_VALUE_SLASH);  
    
    
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
        result = between(validCol, strVal_1, null);
        expect(result).toBe(`${validCol}/${strVal_1}..`);
    
        // valid input, upper bound only - null lower bound
        result = between(validCol, null, strVal_2);
        expect(result).toBe(`${validCol}/..${strVal_2}`);
    
        // valid input, upper bound only - undefined lower bound
        result = between(validCol, undefined, strVal_2);
        expect(result).toBe(`${validCol}/..${strVal_2}`);
    
        // valid input 0, upper bound only - null lower bound
        result = between(validCol, null, 0);
        expect(result).toBe(`${validCol}/..0`);

        // valid input 0, lower bound only - null upper bound
        result = between(validCol, 0, null);
        expect(result).toBe(`${validCol}/0..`);

        // valid input 0, upper bound only - undefined lower bound
        result = between(validCol, undefined, 0);
        expect(result).toBe(`${validCol}/..0`);

        // valid input -100, lower bound only - undefined upper bound
        result = between(validCol, -100, undefined);
        expect(result).toBe(`${validCol}/-100..`);        

        // valid input -100, upper bound only - null lower bound
        result = between(validCol, null, -100);
        expect(result).toBe(`${validCol}/..-100`);

        // valid input -100, lower bound only - null upper bound
        result = between(validCol, -100, null);
        expect(result).toBe(`${validCol}/-100..`);

        // valid input -100, upper bound only - undefined lower bound
        result = between(validCol, undefined, -100);
        expect(result).toBe(`${validCol}/..-100`);

        // valid input -100, lower bound only - undefined upper bound
        result = between(validCol, -100, undefined);
        expect(result).toBe(`${validCol}/-100..`);           

        // valid input - non-column inputs
        // numbers
        result = between(1,5);
        expect(result).toBe(`1..5`);           

        // strings
        result = between('a','c');
        expect(result).toBe(`a..c`);           

        // ERROR TESTS
    
        // too few args
        expect(() => {
            between();
        }).toThrowError(SDB_FILTER_ERR_INVALID_NUM_ARGS);

        expect(() => {
            between(validCol);
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

        expect(() => {
            between(invalidCol_slash, strVal_1, strVal_2);
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
        }).toThrowError(SDB_FILTER_ERR_INVALID_VALUE_EMPTY_STRING); 
    
        // non string/number values in parameters
        expect(() => {
            between(validCol, invalidVal_type, invalidVal_type);
        }).toThrowError(SDB_FILTER_ERR_INVALID_TYPE); 
    
        expect(() => {
            between(validCol, invalidVal_slash, strVal_2);
        }).toThrowError(SDB_FILTER_ERR_INVALID_VALUE_SLASH);  

        expect(() => {
            between(validCol, strVal_1, invalidVal_slash);
        }).toThrowError(SDB_FILTER_ERR_INVALID_VALUE_SLASH);          

        expect(() => {
            between(validCol, strVal_1, invalidVal_dots);
        }).toThrowError(SDB_FILTER_ERR_INVALID_RANGE_VALUE_DOTS);



        expect(() => {
            between([1],[3]);
        }).toThrowError(SDB_FILTER_ERR_INVALID_TYPE);

        // mixed types
        expect(() => {
            between(1,'b');
        }).toThrowError(SDB_FILTER_ERR_INVALID_COMPARE_TYPE);
        
        // array invalid characters in values
        expect(() => {
            between('a',invalidVal_slash);
        }).toThrowError(SDB_FILTER_ERR_INVALID_VALUE_SLASH);

        expect(() => {
            between('a',invalidVal_dots);
        }).toThrowError(SDB_FILTER_ERR_INVALID_RANGE_VALUE_DOTS);

        // empty strings
        expect(() => {
            between(invalidVal_empty,'e');
        }).toThrowError(SDB_FILTER_ERR_INVALID_VALUE_EMPTY_STRING);

        expect(() => {
            between(null,null);
        }).toThrowError(SDB_FILTER_ERR_INVALID_RANGE);

        expect(() => {
            between(undefined, undefined);
        }).toThrowError(SDB_FILTER_ERR_INVALID_RANGE);

    });
    
    test('testing: gte()', () => {
    
        let result;
    
        // valid input, strings
        result = gte(validCol, strVal_1);
        expect(result).toBe(`${validCol}/${strVal_1}..`);

        // valid input, numbers
        result = gte(validCol, intVal_1);
        expect(result).toBe(`${validCol}/${intVal_1}..`);

        result = gte(validCol, 0);
        expect(result).toBe(`${validCol}/0..`);

        result = gte(validCol, -100);
        expect(result).toBe(`${validCol}/-100..`);

        // single number value, no column name
        result = gte(100);
        expect(result).toBe(`100..`);

        // single string value, no column name
        result = gte('a');
        expect(result).toBe(`a..`);


        // ERROR TESTS
    
        // too few args
        expect(() => {
            gte();
        }).toThrowError(SDB_FILTER_ERR_INVALID_NUM_ARGS);

        expect(() => {
            gte(invalidVal_type);
        }).toThrowError(SDB_FILTER_ERR_INVALID_TYPE);

        expect(() => {
            gte(null);
        }).toThrowError(SDB_FILTER_ERR_INVALID_RANGE);
        
        expect(() => {
            gte(undefined);
        }).toThrowError(SDB_FILTER_ERR_INVALID_RANGE);

        expect(() => {
            gte(invalidVal_empty);
        }).toThrowError(SDB_FILTER_ERR_INVALID_VALUE_EMPTY_STRING);

        expect(() => {
            gte(invalidVal_slash);
        }).toThrowError(SDB_FILTER_ERR_INVALID_VALUE_SLASH);

        expect(() => {
            gte(invalidVal_dots);
        }).toThrowError(SDB_FILTER_ERR_INVALID_RANGE_VALUE_DOTS);

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

        expect(() => {
            gte(invalidCol_slash, strVal_1);
        }).toThrowError(SDB_FILTER_ERR_INVALID_COL_NAME); 

        // null input values
        expect(() => {
            gte(validCol, null);
        }).toThrowError(SDB_FILTER_ERR_INVALID_RANGE);   
    
        // undefined input values
        expect(() => {
            gte(validCol, undefined);
        }).toThrowError(SDB_FILTER_ERR_INVALID_RANGE); 
    
        // empty string value
        expect(() => {
            gte(validCol, invalidVal_empty);
        }).toThrowError(SDB_FILTER_ERR_INVALID_VALUE_EMPTY_STRING);

        expect(() => {
            lte(validCol, invalidVal_slash);
        }).toThrowError(SDB_FILTER_ERR_INVALID_VALUE_SLASH);         
    
    });

    test('testing: lte()', () => {
    
        let result;
    
        // valid input, strings
        result = lte(validCol, strVal_1);
        expect(result).toBe(`${validCol}/..${strVal_1}`);
    
        // valid input, numbers
        result = lte(validCol, intVal_1);
        expect(result).toBe(`${validCol}/..${intVal_1}`);
    
        result = lte(validCol, 0);
        expect(result).toBe(`${validCol}/..0`);

        result = lte(validCol, -100);
        expect(result).toBe(`${validCol}/..-100`);        


        // ERROR TESTS
    
        // too few args
        // too few args
        expect(() => {
            lte();
        }).toThrowError(SDB_FILTER_ERR_INVALID_NUM_ARGS);

        expect(() => {
            lte(invalidVal_type);
        }).toThrowError(SDB_FILTER_ERR_INVALID_TYPE);

        expect(() => {
            lte(null);
        }).toThrowError(SDB_FILTER_ERR_INVALID_RANGE);

        expect(() => {
            lte(undefined);
        }).toThrowError(SDB_FILTER_ERR_INVALID_RANGE);

        expect(() => {
            lte(invalidVal_empty);
        }).toThrowError(SDB_FILTER_ERR_INVALID_VALUE_EMPTY_STRING);

        expect(() => {
            lte(invalidVal_slash);
        }).toThrowError(SDB_FILTER_ERR_INVALID_VALUE_SLASH);

        expect(() => {
            lte(invalidVal_dots);
        }).toThrowError(SDB_FILTER_ERR_INVALID_RANGE_VALUE_DOTS);
    
    
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

        expect(() => {
            lte(invalidCol_slash, strVal_1);
        }).toThrowError(SDB_FILTER_ERR_INVALID_COL_NAME);         

        // null input values
        expect(() => {
            lte(validCol, null);
        }).toThrowError(SDB_FILTER_ERR_INVALID_RANGE);   
    
        // undefined input values
        expect(() => {
            lte(validCol, undefined);
        }).toThrowError(SDB_FILTER_ERR_INVALID_RANGE); 
    
        // empty string value
        expect(() => {
            lte(validCol, invalidVal_empty);
        }).toThrowError(SDB_FILTER_ERR_INVALID_VALUE_EMPTY_STRING);

        expect(() => {
            lte(validCol, invalidVal_slash);
        }).toThrowError(SDB_FILTER_ERR_INVALID_VALUE_SLASH);         
        
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
    
        // empty string handling - make sure '/' handled properly
        result = and(`${validCol}/${strVal_1}`,eq('LastName',''));
        expect(result).toBe(`${validCol}/${strVal_1}/LastName/`);
        result = and(eq(validCol,''),`LastName/${strVal_2}`);
        expect(result).toBe(`${validCol}//LastName/${strVal_2}`);
        
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
        let expected = 'Customer/FirstName/A*/LastName/<null>/Country/Brazil/State//City/,Brasília,São Paulo/Invoice/InvoiceDate/2011-01-01../Customer/F*..J*/~BillingCountry/Brazil/InvoiceLine/Track';

        result = 'Customer/' + 
                    and(
                        eq('FirstName','A*'),
                        eq('LastName',null),
                        eq('Country','Brazil'),
                        eq('State',''),
                        any('City','','Brasília','São Paulo').replaceAll(SDB_SEPARATOR,',')
                    ) +
                    '/Invoice/' +
                    and(
                        gte('InvoiceDate','2011-01-01'),
                        between('Customer','F*','J*'),
                        not(eq('BillingCountry','Brazil')),
                        'InvoiceLine/Track'
                    );


        expect(result).toBe(expected);

        // make sure NULLs are updated when placeholder changed
        chgPlaceHolder(null,'@NEWNULL@');
        expected = 'Customer/FirstName/A*/LastName/@NEWNULL@/Country/Brazil/State//City/,Brasília,São Paulo/Invoice/InvoiceDate/2011-01-01../Customer/F*..J*/~BillingCountry/Brazil/InvoiceLine/Track';

        result = 'Customer/' + 
        and(
            eq('FirstName','A*'),
            eq('LastName',null),
            eq('Country','Brazil'),
            eq('State',''),
            any('City','','Brasília','São Paulo').replaceAll(SDB_SEPARATOR,',')
        ) +
        '/Invoice/' +
        and(
            gte('InvoiceDate','2011-01-01'),
            between('Customer','F*','J*'),
            not(eq('BillingCountry','Brazil')),
            'InvoiceLine/Track'
        );

        expect(result).toBe(expected);
        chgPlaceHolder();
        
    });
});
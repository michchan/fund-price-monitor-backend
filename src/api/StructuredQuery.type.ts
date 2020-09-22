/**
 * Structured query string:
 *
 * 1. Format: FIELD_NAME_1[OPERATOR]VALUE_1+FIELD_NAME_N[OPERATOR]VALUE_N
 *    e.g. company[e]aia+code[e]123+name[inc]healthcare,growth,fund+updatedDate[gte]2020-09-10
 *
 * 2. Operators: 
 * 
 *   For general type:
 *    - `e` : is equal to.
 *    - `ie` : is inequal to.
 *    - `gt` : is greater than.
 *    - `lt` : is lower than.
 *    - `gte` : is greater than or equal to.
 *    - `lte` : is greater than or equal to.
 *    - `between` : is between A and B. 
 *      e.g. To query records of updated date in between 2020-09-10 (lower bound) and 2020-09-20 (upper bound),
 *      the expression will be: updatedDate[between]2020-09-10~2020-09-20
 *      (separated by `~`)
 * 
 *   For string only
 *    - `inc` : includes the word(s)
 *      e.g. name[inc]healthcare,growth,fund
 *    - `notinc` : does not include the word(s)
 *    - `beginswith` : begins with word(s)
 * 
 * 3. List of words: 
 *    1. OR: separated by commas:
 *       To match records by name of including either of the following keywords:
 *       e.g. name[inc]healthcare,growth,fund
 *    2. AND: separated by #:
 *       e.g. name[inc]healthcare#growth#fund
 *    3. OR with AND: grouped by commas:
 *       To match records includes either word "healthcare" or words with "fidelity" and "growth"
 *       e.g. name[inc]healthcare,(fidelity#growth)
 */
export type StructuredQueryString = string

export type Operator = 
    | 'e'
    | 'ie'
    | 'gt'
    | 'lt'
    | 'gte'
    | 'lte'
    | 'between'
    | 'inc'
    | 'notinc'
    | 'beginswith'

export type MergeType = 'union' | 'intersect'

export interface StructuredQueryField {
    name: string;
    operator: Operator;
    value: string;
    /** Splitted values */
    values: string[];
}
export type StructuredQuery = StructuredQueryField[];
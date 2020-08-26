


export type Quarter = 'q1' | 'q2' | 'q3' | 'q4'

const quarterMap: { [key: string]: Quarter } = {
    '1-3': 'q1',
    '4-6': 'q2',
    '7-9': 'q3',
    '10-12': 'q4'
}

const getCurrentQuarter = (): Quarter => {
    const date = new Date();
    // The number returned from `date.getMonth()` starts from 0,
    // so it needs to be incremented by 1
    const month = date.getMonth() + 1;
    // Find key
    const key = Object.keys(quarterMap).find(k => {
        const [start, end] = k.split('-')
        return +start <= month && +end >= month
    })
    // Throw error if key is not defined
    if (!key) throw new Error(`key is undefined from getCurrentQuarter`)

    return quarterMap[key]
}

export default getCurrentQuarter



const getIDFromAnchorTag = (anchor: HTMLAnchorElement): string => {
    const matches = (anchor?.href ?? '').match(/id=(.+)$/i) ?? []
    return (matches[1] ?? '').trim()
}
export default getIDFromAnchorTag
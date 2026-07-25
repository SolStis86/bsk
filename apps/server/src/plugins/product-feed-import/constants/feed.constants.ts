/** CSV column headers as they appear in the feed export. */
export const FEED_COLUMNS = {
    uniqueId: 'Unique ID',
    productCode: 'Product Code',
    subproductCode: 'Subproduct Code',
    productName: 'Product Name',
    description: 'Description',
    materials: 'materials',
    sizeImperial: 'Size (imp)',
    sizeMet: 'Size (met)',
    power: 'Power',
    tradePrice: 'Trade Price',
    rrp: 'RRP',
    catalogue: 'Catalogue',
    range: 'Range',
    imageName: 'ImageName',
    thumbImageUrl: 'ThumbImageURL',
    viewImageUrl: 'ViewImageURL',
    hiResUrl: 'Hi-Res URL',
    stockStatus: 'Stock',
    stockLevel: 'StockLevel',
    mpn: 'MPN',
    manufacturer: 'Manufacturer',
    barcode: 'Barcode',
    allCats: 'all_cats',
    weight: 'wieght',
    allImages: 'AllImages',
    shortUnique: 'Short Unique',
} as const;

export const DEFAULT_OPTION_GROUP = 'Flavour';

export const STOCK_IN = 'In Stock';
export const STOCK_OUT = 'Out Stock';

import { useEffect, useState } from 'react';

import { getProducts } from '../../controllers/productController';

import {
  getCategories,
  createCategory,
} from '../../controllers/categoryController';

import { COLORS } from '../../constants/colors';


// ==========================================================
// EXISTING CATEGORY UI
// ==========================================================

const categoryMeta = [
  {
    name: 'Shirt',
    icon: '👔',
    color: COLORS.purpleCard,
  },
  {
    name: 'Pant',
    icon: '👖',
    color: COLORS.blueCard,
  },
  {
    name: 'Underwear',
    icon: '🩲',
    color: COLORS.greenCard,
  },
];


// ==========================================================
// COMPONENT
// ==========================================================

export default function Collection() {

  // --------------------------------------------------------
  // Products
  // --------------------------------------------------------

  const [products, setProducts] = useState([]);


  // --------------------------------------------------------
  // Categories
  // --------------------------------------------------------

  const [categories, setCategories] = useState([]);


  // --------------------------------------------------------
  // Loading
  // --------------------------------------------------------

  const [loading, setLoading] = useState(false);


  // --------------------------------------------------------
  // Create modal
  // --------------------------------------------------------

  const [showModal, setShowModal] = useState(false);


  // --------------------------------------------------------
  // Form
  // --------------------------------------------------------

  const [categoryName, setCategoryName] = useState('');

  const [categoryIcon, setCategoryIcon] = useState('');


  // --------------------------------------------------------
  // Creating
  // --------------------------------------------------------

  const [creating, setCreating] = useState(false);


  // --------------------------------------------------------
  // Success popup
  // --------------------------------------------------------

  const [showSuccess, setShowSuccess] = useState(false);

  const [successMessage, setSuccessMessage] = useState('');


  // --------------------------------------------------------
  // Error popup
  // --------------------------------------------------------

  const [showError, setShowError] = useState(false);

  const [errorMessage, setErrorMessage] = useState('');


  // ========================================================
  // FETCH PRODUCTS
  // ========================================================

  const fetchProducts = async () => {

    console.log('========================================');
    console.log('[Collection] FETCH PRODUCTS START');

    try {

      console.log(
        '[Collection] Calling getProducts()'
      );

      const data = await getProducts();

      console.log(
        '[Collection] Products response:',
        data
      );

      if (Array.isArray(data)) {

        setProducts(data);

        console.log(
          '[Collection] Products count:',
          data.length
        );

      } else {

        console.warn(
          '[Collection] Products response is not array:',
          data
        );

        setProducts([]);
      }

    } catch (error) {

      console.error(
        '[Collection] FETCH PRODUCTS ERROR:',
        error
      );

      setProducts([]);

    } finally {

      console.log(
        '[Collection] FETCH PRODUCTS END'
      );

      console.log('========================================');
    }
  };


  // ========================================================
  // FETCH CATEGORIES
  // ========================================================

  const fetchCategories = async () => {

    console.log('========================================');
    console.log('[Collection] FETCH CATEGORIES START');

    try {

      console.log(
        '[Collection] Calling getCategories()'
      );

      const data = await getCategories();

      console.log(
        '[Collection] Categories response:',
        data
      );

      if (Array.isArray(data)) {

        setCategories(data);

        console.log(
          '[Collection] Categories count:',
          data.length
        );

      } else {

        console.warn(
          '[Collection] Categories response is not array:',
          data
        );

        setCategories([]);
      }

    } catch (error) {

      console.error(
        '[Collection] FETCH CATEGORIES ERROR:',
        error
      );

      setCategories([]);

    } finally {

      console.log(
        '[Collection] FETCH CATEGORIES END'
      );

      console.log('========================================');
    }
  };


  // ========================================================
  // FETCH ALL
  // ========================================================

  const fetchAllData = async () => {

    console.log('########################################');
    console.log(
      '[Collection] FETCH ALL DATA START'
    );

    setLoading(true);

    try {

      await Promise.all([
        fetchProducts(),
        fetchCategories(),
      ]);

      console.log(
        '[Collection] ALL DATA FETCHED SUCCESSFULLY'
      );

    } catch (error) {

      console.error(
        '[Collection] FETCH ALL DATA ERROR:',
        error
      );

    } finally {

      setLoading(false);

      console.log(
        '[Collection] FETCH ALL DATA END'
      );

      console.log('########################################');
    }
  };


  // ========================================================
  // INITIAL LOAD
  // ========================================================

  useEffect(() => {

    console.log(
      '[Collection] Component mounted'
    );

    fetchAllData();

  }, []);


  // ========================================================
  // OPEN CREATE MODAL
  // ========================================================

  const openCreateModal = () => {

    console.log(
      '[Collection] Add Category clicked'
    );

    setCategoryName('');

    setCategoryIcon('');

    setShowError(false);

    setErrorMessage('');

    setShowModal(true);
  };


  // ========================================================
  // CLOSE CREATE MODAL
  // ========================================================

  const closeCreateModal = () => {

    console.log(
      '[Collection] Closing Create Category modal'
    );

    if (creating) {
      return;
    }

    setShowModal(false);

    setCategoryName('');

    setCategoryIcon('');

    setShowError(false);

    setErrorMessage('');
  };


  // ========================================================
  // CLOSE SUCCESS
  // ========================================================

  const closeSuccess = () => {

    console.log(
      '[Collection] Closing success popup'
    );

    setShowSuccess(false);

    setSuccessMessage('');
  };


  // ========================================================
  // CLOSE ERROR
  // ========================================================

  const closeError = () => {

    setShowError(false);

    setErrorMessage('');
  };


  // ========================================================
  // CREATE CATEGORY
  // ========================================================

  const handleCreateCategory = async () => {

    console.log('########################################');
    console.log(
      '[Collection] CREATE CATEGORY START'
    );


    console.log(
      '[Collection] Name:',
      categoryName
    );

    console.log(
      '[Collection] Icon:',
      categoryIcon
    );


    // ------------------------------------------------------
    // Validation
    // ------------------------------------------------------

    if (!categoryName.trim()) {

      console.warn(
        '[Collection] Category name is empty'
      );

      setErrorMessage(
        'Please enter category name'
      );

      setShowError(true);

      return;
    }


    if (!categoryIcon.trim()) {

      console.warn(
        '[Collection] Category icon is empty'
      );

      setErrorMessage(
        'Please enter category icon'
      );

      setShowError(true);

      return;
    }


    try {

      setCreating(true);

      setShowError(false);


      // ----------------------------------------------------
      // POST API
      // ----------------------------------------------------

      console.log(
        '[Collection] Calling createCategory()'
      );


      const response = await createCategory(
        categoryName,
        categoryIcon
      );


      console.log(
        '[Collection] CREATE CATEGORY RESPONSE:',
        response
      );


      // ----------------------------------------------------
      // Close create modal
      // ----------------------------------------------------

      setShowModal(false);

      setCategoryName('');

      setCategoryIcon('');


      // ----------------------------------------------------
      // Fetch latest data
      // ----------------------------------------------------

      console.log(
        '[Collection] Fetching latest data...'
      );


      await fetchAllData();


      console.log(
        '[Collection] Latest data fetched'
      );


      // ----------------------------------------------------
      // Custom success popup
      // ----------------------------------------------------

      setSuccessMessage(
        'Category created successfully'
      );

      setShowSuccess(true);


    } catch (error) {

      console.error(
        '[Collection] CREATE CATEGORY ERROR:',
        error
      );


      setErrorMessage(
        error?.message ||
        'Failed to create category'
      );

      setShowError(true);


    } finally {

      setCreating(false);

      console.log(
        '[Collection] CREATE CATEGORY END'
      );

      console.log('########################################');
    }
  };


  // ========================================================
  // PRODUCT CATEGORY
  // ========================================================

  const getProductCategoryName = (product) => {

    if (
      typeof product?.category === 'string'
    ) {
      return product.category;
    }


    if (
      product?.category &&
      typeof product.category === 'object'
    ) {
      return product.category.name || '';
    }


    return '';
  };


  // ========================================================
  // CATEGORY ICON
  // ========================================================

  const getCategoryIcon = (category) => {

    const icon =
      String(
        category?.icon || ''
      ).toLowerCase();


    const iconMap = {

      shirt: '👔',

      pant: '👖',

      pants: '👖',

      underwear: '🩲',

      shoe: '👟',

      shoes: '👟',

      bag: '👜',

      watch: '⌚',

      jacket: '🧥',

      dress: '👗',

      cap: '🧢',

      sock: '🧦',

    };


    if (iconMap[icon]) {

      return iconMap[icon];
    }


    // Existing UI fallback

    const existing =
      categoryMeta.find(
        (item) =>
          item.name.toLowerCase() ===
          String(
            category?.name || ''
          ).toLowerCase()
      );


    if (existing) {

      return existing.icon;
    }


    return '📦';
  };


  // ========================================================
  // CATEGORY COLOR
  // ========================================================

  const getCategoryColor = (
    category,
    index
  ) => {

    const existing =
      categoryMeta.find(
        (item) =>
          item.name.toLowerCase() ===
          String(
            category?.name || ''
          ).toLowerCase()
      );


    if (existing) {

      return existing.color;
    }


    return categoryMeta[
      index % categoryMeta.length
    ].color;
  };


  // ========================================================
  // UI
  // ========================================================

  return (

    <div>

      {/* ==================================================
          HEADER
      ================================================== */}

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 18,
        }}
      >

        {/* Original title */}

        <div className="card-title">
          Collections
        </div>


        {/* Add Category */}

        <button
          type="button"
          onClick={openCreateModal}
          style={{
            border: 'none',
            background: '#B8F000',
            color: '#000',
            padding: '10px 18px',
            borderRadius: 10,
            fontWeight: 700,
            cursor: 'pointer',
            fontSize: 14,
          }}
        >
          + Add Category
        </button>

      </div>


      {/* ==================================================
          COLLECTION CARDS
      ================================================== */}

      {loading ? (

        <div>
          Loading collections...
        </div>

      ) : (

        <div className="collection-grid">

          {categories.map(
            (category, index) => {

              console.log(
                '[Collection] Display category:',
                category
              );


              // ------------------------------------------------
              // Find products
              // ------------------------------------------------

              const items =
                products.filter(
                  (product) => {

                    const productCategory =
                      getProductCategoryName(
                        product
                      );


                    const categoryName =
                      category?.name || '';


                    console.log(
                      '[Collection] Comparing:',
                      productCategory,
                      'vs',
                      categoryName
                    );


                    return (
                      productCategory
                        .toLowerCase() ===
                      categoryName
                        .toLowerCase()
                    );
                  }
                );


              // ------------------------------------------------
              // Total stock
              // ------------------------------------------------

              const totalStock =
                items.reduce(
                  (
                    sum,
                    product
                  ) =>
                    sum +
                    Number(
                      product?.stock || 0
                    ),
                  0
                );


              console.log(
                '[Collection] Card data:',
                {
                  name: category?.name,
                  items: items.length,
                  stock: totalStock,
                }
              );


              return (

                <div
                  className="collection-card"
                  key={
                    category?.id ||
                    category?.name
                  }
                  style={{
                    background:
                      getCategoryColor(
                        category,
                        index
                      ),
                  }}
                >

                  {/* Icon */}

                  <div
                    style={{
                      fontSize: 30,
                    }}
                  >
                    {getCategoryIcon(
                      category
                    )}
                  </div>


                  {/* Name */}

                  <div
                    style={{
                      fontWeight: 800,
                      marginTop: 8,
                    }}
                  >
                    {category?.name}
                  </div>


                  {/* Items */}

                  <div className="c-count">
                    {items.length} items
                  </div>


                  {/* Stock */}

                  <div
                    style={{
                      fontSize: 12,
                      opacity: 0.7,
                    }}
                  >
                    {totalStock} in stock
                  </div>

                </div>

              );
            }
          )}


          {categories.length === 0 && (

            <div
              style={{
                padding: 20,
                color: '#777',
              }}
            >
              No collections found.
            </div>

          )}

        </div>

      )}


      {/* ==================================================
          CREATE CATEGORY MODAL
      ================================================== */}

      {showModal && (

        <div
          onClick={closeCreateModal}
          style={{
            position: 'fixed',
            inset: 0,
            background:
              'rgba(0, 0, 0, 0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: 16,
            boxSizing: 'border-box',
          }}
        >

          <div
            onClick={(event) =>
              event.stopPropagation()
            }
            style={{
              width: '100%',
              maxWidth: 400,
              maxHeight: '90vh',
              overflowY: 'auto',
              background: '#fff',
              borderRadius: 16,
              padding: 24,
              boxSizing: 'border-box',
              boxShadow:
                '0 10px 40px rgba(0,0,0,0.25)',
            }}
          >

            {/* Modal header */}

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 20,
              }}
            >

              <div
                style={{
                  fontSize: 20,
                  fontWeight: 800,
                }}
              >
                Create Category
              </div>


              <button
                type="button"
                onClick={closeCreateModal}
                disabled={creating}
                style={{
                  border: 'none',
                  background: 'transparent',
                  fontSize: 24,
                  cursor: 'pointer',
                }}
              >
                ×
              </button>

            </div>


            {/* Category Name */}

            <div
              style={{
                marginBottom: 16,
              }}
            >

              <label
                style={{
                  display: 'block',
                  marginBottom: 7,
                  fontSize: 13,
                  fontWeight: 700,
                }}
              >
                Category Name
              </label>


              <input
                type="text"
                value={categoryName}
                disabled={creating}
                onChange={(event) => {

                  console.log(
                    '[Collection] Name:',
                    event.target.value
                  );

                  setCategoryName(
                    event.target.value
                  );
                }}
                placeholder="Enter category name"
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '12px 14px',
                  border:
                    '1px solid #ddd',
                  borderRadius: 10,
                  outline: 'none',
                  fontSize: 14,
                }}
              />

            </div>


            {/* Category Icon */}

            <div
              style={{
                marginBottom: 22,
              }}
            >

              <label
                style={{
                  display: 'block',
                  marginBottom: 7,
                  fontSize: 13,
                  fontWeight: 700,
                }}
              >
                Icon
              </label>


              <input
                type="text"
                value={categoryIcon}
                disabled={creating}
                onChange={(event) => {

                  console.log(
                    '[Collection] Icon:',
                    event.target.value
                  );

                  setCategoryIcon(
                    event.target.value
                  );
                }}
                placeholder="Example: shirt"
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '12px 14px',
                  border:
                    '1px solid #ddd',
                  borderRadius: 10,
                  outline: 'none',
                  fontSize: 14,
                }}
              />


              <div
                style={{
                  marginTop: 7,
                  fontSize: 11,
                  color: '#777',
                }}
              >
                Example: shirt, pant,
                underwear, shoes
              </div>

            </div>


            {/* Buttons */}

            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 10,
              }}
            >

              <button
                type="button"
                onClick={closeCreateModal}
                disabled={creating}
                style={{
                  border: 'none',
                  background: '#eee',
                  padding: '11px 18px',
                  borderRadius: 9,
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                Cancel
              </button>


              <button
                type="button"
                onClick={
                  handleCreateCategory
                }
                disabled={creating}
                style={{
                  border: 'none',
                  background: '#B8F000',
                  color: '#000',
                  padding: '11px 18px',
                  borderRadius: 9,
                  cursor: 'pointer',
                  fontWeight: 700,
                  minWidth: 120,
                }}
              >
                {creating
                  ? 'Creating...'
                  : 'Create'}
              </button>

            </div>

          </div>

        </div>

      )}


      {/* ==================================================
          SUCCESS POPUP
      ================================================== */}

      {showSuccess && (

        <div
          style={{
            position: 'fixed',
            inset: 0,
            background:
              'rgba(0, 0, 0, 0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: 16,
            boxSizing: 'border-box',
          }}
        >

          <div
            style={{
              width: '100%',
              maxWidth: 360,
              background: '#fff',
              borderRadius: 16,
              padding: 28,
              boxSizing: 'border-box',
              textAlign: 'center',
              boxShadow:
                '0 10px 40px rgba(0,0,0,0.25)',
            }}
          >

            {/* Success icon */}

            <div
              style={{
                width: 55,
                height: 55,
                margin: '0 auto 15px',
                borderRadius: '50%',
                background: '#B8F000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 28,
                fontWeight: 800,
              }}
            >
              ✓
            </div>


            {/* Title */}

            <div
              style={{
                fontSize: 20,
                fontWeight: 800,
                marginBottom: 8,
              }}
            >
              Success
            </div>


            {/* Message */}

            <div
              style={{
                color: '#666',
                fontSize: 14,
                marginBottom: 22,
              }}
            >
              {successMessage}
            </div>


            {/* OK */}

            <button
              type="button"
              onClick={closeSuccess}
              style={{
                border: 'none',
                background: '#B8F000',
                color: '#000',
                padding: '10px 30px',
                borderRadius: 9,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              OK
            </button>

          </div>

        </div>

      )}


      {/* ==================================================
          ERROR POPUP
      ================================================== */}

      {showError && (

        <div
          style={{
            position: 'fixed',
            inset: 0,
            background:
              'rgba(0, 0, 0, 0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10001,
            padding: 16,
            boxSizing: 'border-box',
          }}
        >

          <div
            style={{
              width: '100%',
              maxWidth: 360,
              background: '#fff',
              borderRadius: 16,
              padding: 28,
              boxSizing: 'border-box',
              textAlign: 'center',
              boxShadow:
                '0 10px 40px rgba(0,0,0,0.25)',
            }}
          >

            <div
              style={{
                fontSize: 20,
                fontWeight: 800,
                marginBottom: 10,
              }}
            >
              Error
            </div>


            <div
              style={{
                color: '#666',
                fontSize: 14,
                marginBottom: 22,
              }}
            >
              {errorMessage}
            </div>


            <button
              type="button"
              onClick={closeError}
              style={{
                border: 'none',
                background: '#eee',
                padding: '10px 30px',
                borderRadius: 9,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              OK
            </button>

          </div>

        </div>

      )}

    </div>
  );
}
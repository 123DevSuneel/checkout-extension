import {
  reactExtension,
  Banner,
  BlockStack,
  Heading,
  useApi,
  useInstructions,
  useTranslate,
  useCartLines,
  Text,
  Image,
  InlineLayout,
  View,
  useApplyCartLinesChange,
  Progress,
  Icon,
  Pressable
} from "@shopify/ui-extensions-react/checkout";
import { Button } from "@shopify/ui-extensions/checkout";
import { useEffect, useState } from "react";

// 1. Choose an extension target
export default reactExtension("purchase.checkout.reductions.render-after", () => (
  <UpsellExtension />
));

function UpsellExtension() {
  let products = [];
  const translate = useTranslate();
  const { query } = useApi();
  const [recommendedItems, setRecommendedItems] = useState([]);
  const [visibleItems, setVisibleItems] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const instructions = useInstructions();
  const applyCartLinesChange = useApplyCartLinesChange();
  const cartLineItems = useCartLines();

  useEffect(() => {
    const cartProductIds = cartLineItems.map((lineItem) => lineItem.merchandise.product.id);
    cartProductIds.forEach((productId, index) => {
      fetchProductRecommendations(productId, cartProductIds, index);
    });
  }, [cartLineItems, query]);

  function fetchProductRecommendations(productId, cartProductIds, index) {
    query(
      `{
        productRecommendations(productId: "${productId}") {
          featuredImage {
            url
          }
          title
          id
          selectedOrFirstAvailableVariant {
            id
            price {
              amount
              currencyCode
            }
          }
        }
      }`
    )
      .then((response) => processRecommendedProducts(response.data.productRecommendations, cartProductIds, index))
      .catch((error) => console.error(error));
  }

  function processRecommendedProducts(recommendations, cartProductIds, index) {
    const filteredProducts = recommendations.filter(
      (product) => !cartProductIds.includes(product.id)
    );

    products.push(...filteredProducts);

    if (index === cartProductIds.length - 1) {
      const uniqueProducts = products.filter((product, index, self) =>
        index === self.findIndex((p) => p.id === product.id)
      );
      setRecommendedItems(uniqueProducts);
      setVisibleItems(uniqueProducts.slice(0, 2));
    }
  }

  const handleAddToCart = async (variantId) => {
    applyCartLinesChange({ merchandiseId: variantId, quantity: 1, type: "addCartLine" });
  };

  const showNextProducts = () => {
    if (currentIndex + 2 < recommendedItems.length) {
      setCurrentIndex((prevIndex) => prevIndex + 2);
    }
  };

  const showPreviousProducts = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prevIndex) => prevIndex - 2);
    }
  };

  useEffect(() => {
    setVisibleItems(recommendedItems.slice(currentIndex, currentIndex + 2));
  }, [currentIndex, recommendedItems]);

  // 2. Check instructions for feature availability
  if (!instructions.attributes.canUpdateAttributes) {
    return (
      <Banner title="test-checkout" status="warning">
        {translate("attributeChangesAreNotSupported")}
      </Banner>
    );
  }

  // 3. Render a UI
  return (
    <BlockStack border="dotted" padding="tight">
      <Heading inlineAlignment="center">Upsell Products</Heading>
      {visibleItems.length > 0 && (
        <BlockStack spacing="tight">
          {visibleItems.map((product,index) => (
            <InlineLayout columns={['20%', '50%', '30%']} key={index}>
              <View border="none" padding="none" blockAlignment="center">
                <Image
                  source={product.featuredImage.url}
                  alt={product.title}
                  border="base"
                  aspectRatio="1"
                />
              </View>
              <View border="none" padding="base">
                <Text size="medium">{product.title}</Text>
                <BlockStack>
                  <Text padding="tight">
                    {product.selectedOrFirstAvailableVariant.price.currencyCode}{" "}
                    {product.selectedOrFirstAvailableVariant.price.amount}
                  </Text>
                </BlockStack>
              </View>
              <View border="none" padding="none" inlineAlignment="end" blockAlignment="center">
                <Button
                  appearance="monochrome"
                  kind="primary"
                  onPress={() => handleAddToCart(product.selectedOrFirstAvailableVariant.id)}
                >
                  Add
                </Button>
              </View>
            </InlineLayout>
          ))}
        </BlockStack>
      )}

      <BlockStack key="controls" spacing="tight">
        <InlineLayout columns={['25%', '50%', '25%']}>
          <View border="none" padding="none">
            <Pressable
              onPress={showPreviousProducts}
              border="none"
              cornerRadius="none"
              padding="none"
            >
              <Icon size="base" source="chevronLeft" />
            </Pressable>
          </View>
          <View border="none" padding="none" blockAlignment="center">
            <Progress value={((currentIndex + 2) / recommendedItems.length)} />
          </View>
          <View border="none" padding="none" inlineAlignment="end">
            <Pressable
              onPress={showNextProducts}
              border="none"
              cornerRadius="none"
              padding="none"
            >
              <Icon size="base" source="chevronRight" />
            </Pressable>
          </View>
        </InlineLayout>
      </BlockStack>
    </BlockStack>
  );
}

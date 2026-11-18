from typing import Dict, Any
from sqlalchemy.orm import Session
from app.models.admin import PlatformSetting
from app.schemas.marketplace import MarketplaceFeePolicyConfig, MarketplaceFeeCalculationResponse

class MarketplaceFeeService:
    @staticmethod
    def get_fee_config(db: Session) -> MarketplaceFeePolicyConfig:
        """
        Retrieves current marketplace fee policy configuration from platform settings.
        Default: Enabled, ₹20 (2000 paise), seller_fee policy.
        """
        enabled_setting = db.query(PlatformSetting).filter(PlatformSetting.key == "marketplace_fee_enabled").first()
        amount_setting = db.query(PlatformSetting).filter(PlatformSetting.key == "marketplace_fee_amount_paise").first()
        policy_setting = db.query(PlatformSetting).filter(PlatformSetting.key == "marketplace_fee_policy").first()

        fee_enabled = enabled_setting.value.lower() == "true" if enabled_setting else True
        fee_amount = int(amount_setting.value) if amount_setting and amount_setting.value.isdigit() else 2000
        fee_policy = policy_setting.value if policy_setting else "seller_fee"

        return MarketplaceFeePolicyConfig(
            fee_enabled=fee_enabled,
            fee_amount_paise=fee_amount,
            fee_policy=fee_policy
        )

    @staticmethod
    def calculate_fee(item_price_paise: int, config: MarketplaceFeePolicyConfig) -> MarketplaceFeeCalculationResponse:
        """
        Calculates fee amounts based on active platform policy without hardcoding.
        Policies:
        - seller_fee: Seller pays ₹20 (deducted from payout). Buyer pays ₹item_price.
        - buyer_fee: Buyer pays ₹20 (added to checkout). Seller receives ₹item_price.
        - both_fee: Both buyer and seller pay ₹20 each.
        - combined_fee: Single combined ₹20 fee applied to transaction.
        """
        if not config.fee_enabled:
            return MarketplaceFeeCalculationResponse(
                item_price_paise=item_price_paise,
                fee_enabled=False,
                total_fee_paise=0,
                seller_fee_paise=0,
                buyer_fee_paise=0,
                fee_policy=config.fee_policy,
                total_buyer_amount_paise=item_price_paise,
                net_seller_amount_paise=item_price_paise
            )

        amount = config.fee_amount_paise
        policy = config.fee_policy

        if policy == "buyer_fee":
            seller_fee = 0
            buyer_fee = amount
            total_fee = amount
            total_buyer = item_price_paise + buyer_fee
            net_seller = item_price_paise

        elif policy == "both_fee":
            seller_fee = amount
            buyer_fee = amount
            total_fee = seller_fee + buyer_fee
            total_buyer = item_price_paise + buyer_fee
            net_seller = max(0, item_price_paise - seller_fee)

        elif policy == "combined_fee":
            seller_fee = amount // 2
            buyer_fee = amount - seller_fee
            total_fee = amount
            total_buyer = item_price_paise + buyer_fee
            net_seller = max(0, item_price_paise - seller_fee)

        else: # Default: seller_fee
            seller_fee = amount
            buyer_fee = 0
            total_fee = amount
            total_buyer = item_price_paise
            net_seller = max(0, item_price_paise - seller_fee)

        return MarketplaceFeeCalculationResponse(
            item_price_paise=item_price_paise,
            fee_enabled=True,
            total_fee_paise=total_fee,
            seller_fee_paise=seller_fee,
            buyer_fee_paise=buyer_fee,
            fee_policy=policy,
            total_buyer_amount_paise=total_buyer,
            net_seller_amount_paise=net_seller
        )

$ErrorActionPreference = 'Stop'
$destination = Join-Path $PSScriptRoot '..\public\sites\manmatters-com-61d14dee\root-8a5edab2'
New-Item -ItemType Directory -Force -Path $destination | Out-Null
$assets = @{
  'logo.png' = 'https://i.mscwlns.co/media/misc/others/Manmatters%20Logo_egs4fo.png?tr=w-300,c-at_max'
  'search.png' = 'https://i.mscwlns.co/media/misc/others/search_fpvcyk.png?tr=w-50,c-at_max'
  'profile.png' = 'https://i.mscwlns.co/media/misc/others/profile_f09thu.png?tr=w-50,c-at_max'
  'cart.png' = 'https://i.mscwlns.co/media/misc/others/cart_m7qa5l.png?tr=w-50,c-at_max'
  'hero-wellness.png' = 'https://i.mscwlns.co/media/misc/others/Hero%20Banner%20%C3%A2%C2%80%C2%94%20Desktop%20%C3%A2%C2%80%C2%94%201_1p6vwq.png?tr=w-1440,c-at_max'
  'hero-creatine.png' = 'https://i.mscwlns.co/media/misc/others/Hero%20Banner%20%C3%A2%C2%80%C2%94%20Desktop%20%C3%A2%C2%80%C2%94%203_2yvahm.png?tr=w-1440,c-at_max'
  'hero-hair.png' = 'https://i.mscwlns.co/media/misc/others/Hero%20Banner%20%C3%A2%C2%80%C2%94%20Desktop%20%C3%A2%C2%80%C2%94%202_ud8x4t.png?tr=w-1440,c-at_max'
  'concern-hair.png' = 'https://i.mscwlns.co/media/misc/others/Explore%20by%20concern%20%C3%A2%C2%80%C2%94%20Hair_43nd2l.png?tr=w-800,c-at_max'
  'concern-beard.png' = 'https://i.mscwlns.co/media/misc/others/Explore%20by%20concern%20%C3%A2%C2%80%C2%94%20Beard_bbmpq4.png?tr=w-800,c-at_max'
  'concern-skin.png' = 'https://i.mscwlns.co/media/misc/others/Explore%20by%20concern%20%C3%A2%C2%80%C2%94%20Skin_eifcha.png?tr=w-800,c-at_max'
  'concern-nutrition.png' = 'https://i.mscwlns.co/media/misc/others/Explore%20by%20concern%20%C3%A2%C2%80%C2%94%20Nutrition_di30hu.png?tr=w-800,c-at_max'
  'product-electrolyte.jpg' = 'https://i.mscwlns.co/media/misc/pdp_rcl/2025110/c%2BE%20thumbnail_1vh43z.jpg?tr=w-800,c-at_max'
  'product-creatine.jpg' = 'https://i.mscwlns.co/media/misc/pdp_rcl/2025025/125_b8btap.jpg?tr=w-800,c-at_max'
  'product-shilajit.png' = 'https://i.mscwlns.co/media/misc/pdp_rcl/2024397/Shilajit%2060%20%2815%29_jkaf02.png?tr=w-800,c-at_max'
  'product-magnesium.jpg' = 'https://i.mscwlns.co/media/misc/pdp_rcl/2025070/Magnesium-Gummies-%282%29_i04434.jpg?tr=w-800,c-at_max'
  'product-lotion.png' = 'https://i.mscwlns.co/media/misc/pdp_rcl/2024474/Magnesium%20Muscle%20Recovery%20Lotion_hnvv06.png?tr=w-800,c-at_max'
  'product-shilajit-advanced.png' = 'https://i.mscwlns.co/media/misc/pdp_rcl/2024468/Shilajit%20Advanced%2060_63g0a8.png?tr=w-800,c-at_max'
  'hero-assessment.png' = 'https://i.mscwlns.co/media/misc/others/Hero%20Banner%20%C3%A2%C2%80%C2%94%20Desktop%20%C3%A2%C2%80%C2%94%204_5olf3u.png?tr=w-1440,c-at_max'
  'review-1.png' = 'https://i.mscwlns.co/media/misc/others/Text%20review%20%C3%A2%C2%80%C2%94%201_51zr7a.png?tr=w-500,c-at_max'
  'review-2.png' = 'https://i.mscwlns.co/media/misc/others/Text%20review%20%C3%A2%C2%80%C2%94%202_b6ig21.png?tr=w-500,c-at_max'
  'review-3.png' = 'https://i.mscwlns.co/media/misc/others/Text%20review%20%C3%A2%C2%80%C2%94%203_kx1yh9.png?tr=w-500,c-at_max'
  'review-4.png' = 'https://i.mscwlns.co/media/misc/others/Text%20review%20%C3%A2%C2%80%C2%94%204_1duha4.png?tr=w-500,c-at_max'
  'review-5.png' = 'https://i.mscwlns.co/media/misc/others/Text%20review%20%C3%A2%C2%80%C2%94%205_m9xg2x.png?tr=w-500,c-at_max'
  'app-google.png' = 'https://i.mscwlns.co/media/misc/others/google_3cyh7d.png?tr=w-300,c-at_max'
  'app-apple.png' = 'https://i.mscwlns.co/media/misc/others/apple_kg9bkw.png?tr=w-300,c-at_max'
}
foreach ($asset in $assets.GetEnumerator()) {
  curl.exe -L --http1.1 --compressed -A 'Mozilla/5.0' $asset.Value -o (Join-Path $destination $asset.Key)
}

Pod::Spec.new do |s|
  s.name           = 'NearbyBle'
  s.version        = '1.0.0'
  s.summary        = 'NearbyPay BLE discovery and GATT pairing'
  s.description    = 'Foreground BLE discovery for nearby NearbyPay receivers.'
  s.license        = { :type => 'MIT' }
  s.author         = 'NearbyPay'
  s.homepage       = 'https://nearbypay.me'
  s.platforms      = { :ios => '16.4' }
  s.swift_version  = '5.9'
  s.source         = { :git => 'https://nearbypay.me' }
  s.static_framework = true
  s.dependency 'ExpoModulesCore'
  s.source_files = '**/*.{h,m,mm,swift}'
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule'
  }
end
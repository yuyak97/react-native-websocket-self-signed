#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

@interface RCT_EXTERN_MODULE(WebSocketWithSelfSignedCert, RCTEventEmitter)

RCT_EXTERN_METHOD(connect:(NSString *)url
                  headers:(NSDictionary *)headers
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(send:(NSString *)url message:(NSString *)message)
RCT_EXTERN_METHOD(sendBinaryBase64:(NSString *)url base64String:(NSString *)base64String)
RCT_EXTERN_METHOD(close:(NSString *)url)

@end

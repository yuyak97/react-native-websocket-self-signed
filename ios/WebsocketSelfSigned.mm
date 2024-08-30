#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

@interface RCT_EXTERN_MODULE(WebSocketSelfSigned, RCTEventEmitter)
RCT_EXTERN_METHOD(connect:(NSString *)url resolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(send:(NSString *)message)
RCT_EXTERN_METHOD(close)
@end

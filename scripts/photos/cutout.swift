// Background removal with Apple's Vision (macOS 14+): foreground instance mask → transparent PNG.
// usage: swift cutout.swift <input> <output.png>
import Foundation
import Vision
import CoreImage
import AppKit

let args = CommandLine.arguments
guard args.count == 3 else { print("usage: cutout <in> <out.png>"); exit(1) }
let url = URL(fileURLWithPath: args[1])
guard let ciImage = CIImage(contentsOf: url, options: [.applyOrientationProperty: true]) else { print("cannot read"); exit(1) }
let request = VNGenerateForegroundInstanceMaskRequest()
let handler = VNImageRequestHandler(ciImage: ciImage, options: [:])
try handler.perform([request])
guard let result = request.results?.first else { print("no foreground found"); exit(2) }
let maskBuffer = try result.generateScaledMaskForImage(forInstances: result.allInstances, from: handler)
let mask = CIImage(cvPixelBuffer: maskBuffer)
let blend = CIFilter(name: "CIBlendWithMask")!
blend.setValue(ciImage, forKey: kCIInputImageKey)
blend.setValue(CIImage(color: .clear).cropped(to: ciImage.extent), forKey: kCIInputBackgroundImageKey)
blend.setValue(mask, forKey: kCIInputMaskImageKey)
let output = blend.outputImage!.cropped(to: ciImage.extent)
let context = CIContext()
let cs = CGColorSpace(name: CGColorSpace.sRGB)!
try context.writePNGRepresentation(of: output, to: URL(fileURLWithPath: args[2]), format: .RGBA8, colorSpace: cs, options: [:])
print("ok", Int(output.extent.width), Int(output.extent.height))

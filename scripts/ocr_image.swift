import Foundation
import Vision
import AppKit

let args = CommandLine.arguments
guard args.count >= 2 else {
    fputs("usage: swift ocr_image.swift <image_path>\n", stderr)
    exit(1)
}

let path = args[1]
let url = URL(fileURLWithPath: path)

let request = VNRecognizeTextRequest()
request.recognitionLevel = .accurate
request.usesLanguageCorrection = true

let handler = VNImageRequestHandler(url: url)
try handler.perform([request])

let results = request.results ?? []
for observation in results {
    if let topCandidate = observation.topCandidates(1).first {
        print(topCandidate.string)
    }
}

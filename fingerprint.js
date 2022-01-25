const fpPromise = import('./fingerprint.min.js')
    .then(FingerprintJS => FingerprintJS.load())

// Get the visitor identifier when you need it.
fpPromise
    .then(fp => fp.get())
    .then(result => {
        // This is the visitor identifier:
        player_state.id = result.visitorId

    })
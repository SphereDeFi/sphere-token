const _rewardToken = '0x580A84C73811E1839F75d86d75d88cCa0c241fF4' //Sphere Token
const _principle = '0xe7519Be0E2A4450815858343ca480d1939bE7281'
const _treasury = '0x7754d8b057CC1d2D857d897461DAC6C3235B4aAe'
const _bondCalculator = '0x1AfD960766837E5Da6923897d97aC902C61d4b67'
const ADDRESS = '0x3d60538Cde8Da6Fce9F73cfAeD1F2218c126F08E'

async function main() {
  await verify(ADDRESS, [_rewardToken, _principle, _treasury, _bondCalculator])
}

async function verify(address, constructorArguments) {
  try {
    await hre.run('verify:verify', {
      address,
      constructorArguments,
    })
  } catch (err) {
    console.warn(`verify failed: ${address} ${err.message}`)
  }
}

main()
  .then(() => process.exit())
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })

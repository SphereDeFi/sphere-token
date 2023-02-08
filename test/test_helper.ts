import {BigNumber} from "ethers";
import chai from "chai";

const {expect} = chai;

export class TestHelper {


  public static gte(actual: BigNumber, expected: BigNumber) {
    expect(actual.gte(expected)).is.eq(true,
      `Expected: ${expected.toString()}, actual: ${actual.toString()}`);
  }

  public static closer(actual: BigNumber, expected: BigNumber, delta: BigNumber) {
    expect(actual.gte(expected.sub(delta)) && actual.lte(expected.add(delta))).is.eq(true,
      `Expected: ${expected.sub(delta).toString()} - ${expected.add(delta).toString()}, actual: ${actual.toString()}, delta: ${expected.sub(actual)}`);
  }

}

module.exports = (int) => {
  switch (int) {
    case 1:
    case "1":
      return "Monday";
    case 2:
    case "2":
      return "Tuesday";
    case 3:
    case "3":
      return "Wednesday";
    case 4:
    case "4":
      return "Thursday";
    case 5:
    case "5":
      return "Friday";
    case 6:
    case "6":
      return "Saturday";
    default:
      return "Monday";
  }
}
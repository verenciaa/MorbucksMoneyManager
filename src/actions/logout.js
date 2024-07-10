// //when the delete user btn was clicked and want to login using the same name it still show the expenses
// // rrd imports
import { redirect } from "react-router-dom";

// library
import { toast } from "react-toastify";

// helpers
import { deleteItem } from "../helpers";

export async function logoutAction() {
  // delete the user
  deleteItem({
    key: "userName"
  })
  toast.success("You’ve deleted your account!")
  // return redirect
  return redirect("/")
}


// this code will delete all of the budget that was created by the user if the user click the delete account button
// rrd imports
// import { redirect } from "react-router-dom";

// // library
// import { toast } from "react-toastify";

// // helpers
// import { deleteItem } from "../helpers";

// export async function logoutAction() {
//   // delete the user
//   deleteItem({
//     key: "userName"
//   })
//   deleteItem({
//     key: "budgets"
//   })
//   deleteItem({
//     key: "expenses"
//   })
//   toast.success("You’ve deleted your account!")
//   // return redirect
//   return redirect("/")
// }
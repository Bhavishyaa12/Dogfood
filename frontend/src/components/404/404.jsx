import sadface from "../../assets/sadface.gif";
import "./404.css";
function Not_found() {
  return (
    <div className="error-message">
      <h1 className="not-found-header">
        {"{ status: 404, message: “Document not found.” }"}
      </h1>
      <img src={sadface} alt="sad-face" width={200} className="sad-face" />
      <p className="error-text">
        Oops,We can't find a page you were looking for
      </p>
    </div>
  );
}
export default Not_found;

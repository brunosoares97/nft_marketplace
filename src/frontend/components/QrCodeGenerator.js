import CryptoJS from 'crypto-js';
import QRCode from 'qrcode.react';
import React, { useState } from 'react';
import { Button, Form, Row } from 'react-bootstrap';

const QrCodeGenerator = () => {
	const [qrCodeDataList, setQrCodeDataList] = useState([]);
	const [numberOfQrCodes, setNumberOfQrCodes] = useState(1);
	const [originalData, setOriginalData] = useState('');
	const [password, setPassword] = useState('');

	const generateQRCode = () => {
		const qrCodeDataList = Array.from(
			{ length: numberOfQrCodes },
			(_, index) => {
				//if it is to remove the number in the end of the data, just remove at is in paratenses
				const encryptedData = CryptoJS.AES.encrypt(
					originalData + index,
					password
				).toString();
				return encryptedData;
			}
		);
		setQrCodeDataList(qrCodeDataList);
	};

	const downloadQRCode = (index) => {
		const canvas = document.querySelector(`#qrCode_${index}`); // Get the specific QRCode canvas element
		const dataUrl = canvas.toDataURL('image/png');
		const anchor = document.createElement('a');
		anchor.href = dataUrl;
		anchor.download = `qrCode${index + 1}.png`;
		anchor.click();
	};

	const downloadAllQRCodes = () => {
		qrCodeDataList.forEach((_, index) => {
			downloadQRCode(index);
		});
	};

	const handleInputChange = (event) => {
		setNumberOfQrCodes(Number(event.target.value));
	};

	const handleOriginalDataChange = (event) => {
		setOriginalData(event.target.value);
	};

	const handlePasswordChange = (event) => {
		setPassword(event.target.value);
	};

	return (
		<div className="container-fluid mt-5">
			<div className="row">
				<main
					role="main"
					className="col-lg-12 mx-auto"
					style={{ maxWidth: '1000px' }}
				>
					<div className="content mx-auto">
						<Row className="g-4">
							<Form.Control
								onChange={handleOriginalDataChange}
								value={originalData}
								size="lg"
								required
								type="text"
								placeholder="Original Data"
							/>
							<Form.Control
								onChange={handlePasswordChange}
								value={password}
								size="lg"
								required
								type="password"
								placeholder="Password"
							/>
							<Form.Control
								onChange={handleInputChange}
								size="lg"
								required
								type="number"
								placeholder="Number of QR Codes"
							/>
							<div className="d-grid px-0">
								<Button type="button" onClick={generateQRCode}>
									Generate QR Codes
								</Button>
							</div>
							{qrCodeDataList.map((qrCodeData, index) => (
								<div key={index}>
									<QRCode
										id={`qrCode_${index}`}
										value={qrCodeData}
										size={128}
									/>
									<div className="d-grid px-0">
										<Button onClick={() => downloadQRCode(index)}>
											Download QR Code {index + 1}
										</Button>
									</div>
								</div>
							))}
							{qrCodeDataList.length > 0 && (
								<Button onClick={downloadAllQRCodes}>
									Download All QR Codes
								</Button>
							)}
						</Row>
					</div>
				</main>
			</div>
		</div>
	);
};

export default QrCodeGenerator;

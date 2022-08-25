<?php
    error_reporting(E_ALL);
    $data = $_POST['input']; // the key we sent was "something"
    $f = fopen($_POST['name'], 'a');
    fwrite($f, $data);
    fclose($f);
?>
